import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

// --- Type Definitions ---
interface Position {
  quantity: string;
  name: string;
  isin: string;
  price: string;
}

interface ExtractedPdfData {
  statementDate: string;
  positions: Position[];
}

// --- Configuration ---
const ISIN_TO_SYMBOL_MAP: { [key: string]: string } = {
  IE00B3RBWM25: 'VWRL',
  US0231351067: 'AMZN',
  US7561091049: 'O',
};
// --- End Configuration ---

/**
 * The line-by-line parsing function with corrected price logic.
 * @param text The raw text content from the PDF.
 * @returns An object containing the statement date and positions, or null if parsing fails.
 */
const parseTextLineByLine = (text: string): ExtractedPdfData | null => {
  const dateMatch = text.match(/DEPOTAUSZUG\s+zum\s+(\d{2}\.\d{2}\.\d{4})/);
  if (!dateMatch || !dateMatch[1]) {
    console.error(
      'Error: Could not find the main statement date ("zum DD.MM.YYYY").'
    );
    return null;
  }
  const statementDate = dateMatch[1];

  const positionsBlockMatch = text.match(
    /POSITIONEN([\s\S]*)ANZAHL POSITIONEN/
  );
  if (!positionsBlockMatch || !positionsBlockMatch[1]) {
    console.error('Error: Could not find the main "POSITIONEN" block.');
    return null;
  }
  const positionsBlock = positionsBlockMatch[1];
  const lines = positionsBlock.split('\n').filter((line) => line.trim() !== '');

  const positions: Position[] = [];
  let currentPosition: Partial<Position> = {};

  for (const line of lines) {
    if (line.includes('Stk.')) {
      if (currentPosition.isin) {
        positions.push(currentPosition as Position);
      }
      currentPosition = {};

      const quantityMatch = line.match(/(\d+,\d+)/);
      currentPosition.quantity = quantityMatch
        ? quantityMatch[1].replace(',', '.')
        : '';
      currentPosition.name = line.substring(line.indexOf('Stk.') + 4).trim();
    } else if (currentPosition.name && line.includes('ISIN:')) {
      // Only look for ISIN if we have a name
      const isinMatch = line.match(/ISIN:\s*([A-Z0-9]{12})/);
      currentPosition.isin = isinMatch ? isinMatch[1] : '';
    }
    // --- CORRECTED PRICE LOGIC ---
    // If we have an ISIN but don't yet have a price, the first number we find must be the price per share.
    else if (
      currentPosition.isin &&
      !currentPosition.price &&
      line.match(/\d+,\d+/)
    ) {
      const priceMatch = line.match(/(\d+,\d+)/);
      currentPosition.price = priceMatch ? priceMatch[1].replace(',', '.') : '';
    }
  }

  if (currentPosition.isin) {
    positions.push(currentPosition as Position);
  }

  if (positions.length === 0) {
    console.error('Line-by-line parser failed to find any positions.');
    return null;
  }

  return { statementDate, positions };
};

const formatToSnowballCsv = (data: ExtractedPdfData): string => {
  const csvHeaders =
    'Event,Date,Symbol,Price,Quantity,Currency,FeeTax,Exchange,FeeCurrency,DoNotAdjustCash,Note';
  const [day, month, year] = data.statementDate.split('.');
  const formattedDate = `${year}-${month}-${day}`;

  const csvRows = data.positions.map((position) => {
    const symbol = ISIN_TO_SYMBOL_MAP[position.isin] || 'UNKNOWN';
    const row: string[] = [
      'Buy',
      formattedDate,
      symbol,
      position.price,
      position.quantity,
      'EUR',
      '0',
      'Lang & Schwarz Exchange',
      'EUR',
      'TRUE',
      `Portfolio snapshot from ${data.statementDate}`,
    ];
    return row.join(',');
  });
  return [csvHeaders, ...csvRows].join('\n');
};

const main = async (): Promise<void> => {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error('Error: Please provide the path to your PDF file.');
    console.log('Usage: npm run convert /path/to/your/Securities.pdf');
    process.exit(1);
  }
  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: File not found at ${pdfPath}`);
    process.exit(1);
  }
  try {
    console.log(`Parsing PDF: ${pdfPath}...`);
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(dataBuffer);

    console.log('Using line-by-line parsing method...');
    const extractedData = parseTextLineByLine(pdfData.text);
    if (!extractedData) return;

    console.log(
      `Successfully found ${extractedData.positions.length} positions for date ${extractedData.statementDate}.`
    );
    const csvContent = formatToSnowballCsv(extractedData);
    const outputDir = path.dirname(pdfPath);
    const outputFilename = 'snowball_import.csv';
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, csvContent);
    console.log(`\n✅ Success! CSV file created at: ${outputPath}`);
  } catch (error) {
    console.error('\nAn unexpected error occurred:', error);
    process.exit(1);
  }
};

main();
