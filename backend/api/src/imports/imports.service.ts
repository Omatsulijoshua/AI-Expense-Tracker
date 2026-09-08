import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ParseImportDto, PreviewImportDto, ExecuteImportDto, ImportRowItemDto, ColumnMappingDto } from './dto/imports.dto';
import { TransactionType, TransactionSource } from '@prisma/client';

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parse CSV content into headers and preview rows, auto-detecting column mappings.
   */
  async parseFileContent(dto: ParseImportDto) {
    const lines = dto.fileContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      throw new BadRequestException('Import file is empty');
    }

    const delimiter = this.detectDelimiter(lines[0]);
    const headers = this.parseCsvRow(lines[0], delimiter);
    const sampleRows = lines.slice(1, 6).map((line) => this.parseCsvRow(line, delimiter));

    const autoMapping = this.detectColumnMapping(headers);

    return {
      delimiter,
      headers,
      totalRows: lines.length - 1,
      sampleRows,
      autoMapping,
    };
  }

  /**
   * Preview import rows with field validation and duplicate detection against existing DB records.
   */
  async previewImport(userId: string, workspaceId: string, dto: PreviewImportDto) {
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, userId, workspaceId },
    });

    if (!account) {
      throw new NotFoundException('Target account not found');
    }

    const lines = dto.fileContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length <= 1) {
      throw new BadRequestException('Import file must contain at least one header line and one data row');
    }

    const delimiter = this.detectDelimiter(lines[0]);
    const dataLines = lines.slice(1);

    // Fetch existing transactions for this account to run duplicate detection
    const existingTransactions = await this.prisma.transaction.findMany({
      where: { accountId: dto.accountId, userId, workspaceId },
      select: {
        id: true,
        transactionDate: true,
        amount: true,
        description: true,
        externalTransactionId: true,
      },
    });

    const parsedRows: ImportRowItemDto[] = [];
    let duplicateCount = 0;
    let validCount = 0;
    let invalidCount = 0;

    for (let index = 0; index < dataLines.length; index++) {
      const line = dataLines[index];
      const cols = this.parseCsvRow(line, delimiter);
      const rowResult = this.processRow(cols, dto.columnMapping, existingTransactions);

      if (!rowResult.isValid) {
        invalidCount++;
      } else if (rowResult.isDuplicate) {
        duplicateCount++;
      } else {
        validCount++;
      }

      parsedRows.push(rowResult);
    }

    return {
      accountId: account.id,
      accountName: account.name,
      totalRows: dataLines.length,
      validRows: validCount,
      duplicateRows: duplicateCount,
      invalidRows: invalidCount,
      rows: parsedRows,
    };
  }

  /**
   * Execute batch import within a database transaction and update account balance.
   */
  async executeImport(userId: string, workspaceId: string, dto: ExecuteImportDto) {
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, userId, workspaceId },
    });

    if (!account) {
      throw new NotFoundException('Target account not found');
    }

    const rowsToImport = dto.rows.filter((r) => r.isValid && !r.isDuplicate);

    if (rowsToImport.length === 0) {
      return {
        message: 'No valid non-duplicate transactions to import',
        importedCount: 0,
        accountBalance: Number(account.currentBalance),
      };
    }

    let netBalanceDelta = 0;

    const result = await this.prisma.$transaction(async (tx) => {
      const createdTransactions = [];

      for (const row of rowsToImport) {
        const txType = row.type || TransactionType.EXPENSE;
        const amount = Math.abs(row.amount);

        if (txType === TransactionType.INCOME) {
          netBalanceDelta += amount;
        } else {
          netBalanceDelta -= amount;
        }

        const newTx = await tx.transaction.create({
          data: {
            userId,
            workspaceId,
            accountId: account.id,
            type: txType,
            amount: amount,
            currency: account.currency,
            description: row.description || 'Imported Transaction',
            transactionDate: new Date(row.transactionDate),
            categoryId: row.categoryId || null,
            externalTransactionId: row.externalTransactionId || null,
            source: TransactionSource.IMPORT,
            status: 'COMPLETED',
          },
        });
        createdTransactions.push(newTx);
      }

      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: {
          currentBalance: { increment: netBalanceDelta },
          availableBalance: { increment: netBalanceDelta },
        },
      });

      return {
        importedCount: createdTransactions.length,
        accountBalance: Number(updatedAccount.currentBalance),
      };
    });

    return {
      message: `Successfully imported ${result.importedCount} transactions`,
      importedCount: result.importedCount,
      accountBalance: result.accountBalance,
    };
  }

  // --- Helper Methods ---

  private detectDelimiter(line: string): string {
    const commaCount = (line.match(/,/g) || []).length;
    const semicolonCount = (line.match(/;/g) || []).length;
    const tabCount = (line.match(/\t/g) || []).length;

    if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
    if (semicolonCount > commaCount) return ';';
    return ',';
  }

  private parseCsvRow(row: string, delimiter: string): string[] {
    const pattern = new RegExp(
      `(\\${delimiter}|\\r?\\n|\\r|^)(?:"([^"]*(?:""[^"]*)*)"|([^"\\${delimiter}\\r\\n]*))`,
      'gi',
    );
    const matches: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(row))) {
      const matchedDelimiter = match[1];
      if (matchedDelimiter.length && matchedDelimiter !== delimiter && matches.length === 0) {
        // start of line empty match ignore
      }
      let value = match[2] !== undefined ? match[2].replace(/""/g, '"') : match[3];
      matches.push(value !== undefined ? value.trim() : '');
    }

    return matches.length > 0 ? matches : row.split(delimiter).map((s) => s.trim());
  }

  private detectColumnMapping(headers: string[]): ColumnMappingDto {
    let dateIdx = -1;
    let amountIdx = -1;
    let descIdx = -1;
    let categoryIdx = -1;
    let typeIdx = -1;
    let externalIdIdx = -1;

    headers.forEach((header, idx) => {
      const h = header.toLowerCase();
      if (dateIdx === -1 && (h.includes('date') || h.includes('time'))) dateIdx = idx;
      else if (amountIdx === -1 && (h.includes('amount') || h.includes('val') || h.includes('sum') || h.includes('price'))) amountIdx = idx;
      else if (descIdx === -1 && (h.includes('desc') || h.includes('payee') || h.includes('merchant') || h.includes('detail') || h.includes('name'))) descIdx = idx;
      else if (categoryIdx === -1 && (h.includes('cat') || h.includes('tag'))) categoryIdx = idx;
      else if (typeIdx === -1 && (h.includes('type') || h.includes('kind'))) typeIdx = idx;
      else if (externalIdIdx === -1 && (h.includes('id') || h.includes('ref') || h.includes('txid'))) externalIdIdx = idx;
    });

    return {
      dateColumnIndex: dateIdx !== -1 ? dateIdx : 0,
      amountColumnIndex: amountIdx !== -1 ? amountIdx : 1,
      descriptionColumnIndex: descIdx !== -1 ? descIdx : 2,
      categoryColumnIndex: categoryIdx !== -1 ? categoryIdx : undefined,
      typeColumnIndex: typeIdx !== -1 ? typeIdx : undefined,
      externalIdColumnIndex: externalIdIdx !== -1 ? externalIdIdx : undefined,
    };
  }

  private processRow(
    cols: string[],
    mapping: ColumnMappingDto,
    existingTxs: Array<{ id: string; transactionDate: Date; amount: any; description: string | null; externalTransactionId: string | null }>,
  ): ImportRowItemDto {
    const rawDate = cols[mapping.dateColumnIndex];
    const rawAmount = cols[mapping.amountColumnIndex];
    const rawDesc = cols[mapping.descriptionColumnIndex];
    const rawCategory = mapping.categoryColumnIndex !== undefined ? cols[mapping.categoryColumnIndex] : undefined;
    const rawType = mapping.typeColumnIndex !== undefined ? cols[mapping.typeColumnIndex] : undefined;
    const rawExternalId = mapping.externalIdColumnIndex !== undefined ? cols[mapping.externalIdColumnIndex] : undefined;

    if (!rawDate || !rawAmount) {
      return {
        transactionDate: new Date().toISOString(),
        amount: 0,
        description: rawDesc || 'Invalid row',
        isValid: false,
        validationError: 'Missing required date or amount column',
      };
    }

    const parsedDate = new Date(rawDate);
    if (isNaN(parsedDate.getTime())) {
      return {
        transactionDate: new Date().toISOString(),
        amount: 0,
        description: rawDesc || 'Invalid date',
        isValid: false,
        validationError: `Invalid date format: "${rawDate}"`,
      };
    }

    const numericAmount = parseFloat(rawAmount.replace(/[^0-9.-]+/g, ''));
    if (isNaN(numericAmount)) {
      return {
        transactionDate: parsedDate.toISOString(),
        amount: 0,
        description: rawDesc || 'Invalid amount',
        isValid: false,
        validationError: `Invalid numerical amount: "${rawAmount}"`,
      };
    }

    let type: 'INCOME' | 'EXPENSE' = 'EXPENSE';
    if (rawType) {
      const upperType = rawType.toUpperCase();
      if (upperType.includes('INC') || upperType.includes('CREDIT') || upperType.includes('DEPOSIT')) {
        type = 'INCOME';
      }
    } else if (numericAmount > 0) {
      type = 'EXPENSE'; // standard statement positive = expense or default
    }

    const absAmount = Math.abs(numericAmount);
    const dateIso = parsedDate.toISOString();

    // Check for duplicates
    let isDuplicate = false;
    let duplicateReason: string | undefined = undefined;

    if (rawExternalId) {
      const extMatch = existingTxs.find((tx) => tx.externalTransactionId === rawExternalId);
      if (extMatch) {
        isDuplicate = true;
        duplicateReason = `Matches existing external transaction ID (${rawExternalId})`;
      }
    }

    if (!isDuplicate) {
      const exactMatch = existingTxs.find((tx) => {
        const txDateStr = tx.transactionDate.toISOString().split('T')[0];
        const rowDateStr = dateIso.split('T')[0];
        const sameDate = txDateStr === rowDateStr;
        const sameAmount = Math.abs(Number(tx.amount)) === absAmount;
        return sameDate && sameAmount;
      });

      if (exactMatch) {
        isDuplicate = true;
        duplicateReason = `Exact match found on date (${dateIso.split('T')[0]}) and amount (${absAmount})`;
      }
    }

    return {
      transactionDate: dateIso,
      amount: absAmount,
      description: rawDesc || 'Imported Record',
      type,
      externalTransactionId: rawExternalId || undefined,
      isDuplicate,
      duplicateReason,
      isValid: true,
    };
  }
}
