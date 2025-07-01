import { Customer, Purchase, CustomerSegment } from '../types';

// Simple CSV parser (limited, e.g., doesn't handle commas in quoted fields well)
function parseCsv(csvText: string): Array<Record<string, string>> {
  const lines = csvText.trim().split(/\r\n|\n/);
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase()); // Use lowercase headers for robust mapping
  const requiredHeaders = ['id', 'name', 'email', 'total_spent', 'purchase_count', 'last_purchase_date'];
  for (const reqHeader of requiredHeaders) {
    if (!headers.includes(reqHeader)) {
      throw new Error(`Missing required CSV column: ${reqHeader}. Ensure header row is present and correct.`);
    }
  }
  
  const records: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let currentVal = '';
    let inQuotes = false;
    for (const char of lines[i]) {
        if (char === '"' && (lines[i][lines[i].indexOf(char) -1] !== '\\' )) { // Handle escaped quotes later if necessary
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(currentVal.trim());
            currentVal = '';
        } else {
            currentVal += char;
        }
    }
    values.push(currentVal.trim());

    if (values.length !== headers.length) {
      console.warn(`Line ${i + 1} has ${values.length} values, expected ${headers.length}. Skipping line: "${lines[i]}"`);
      continue; 
    }
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index].replace(/^"|"$/g, '').replace(/""/g, '"'); // Remove surrounding quotes and unescape double quotes
    });
    records.push(record);
  }
  return records;
}


export const processUploadedCsvData = (file: File): Promise<Customer[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        if (!csvText) {
          throw new Error("File is empty or could not be read.");
        }
        const jsonData = parseCsv(csvText);
        
        const customers: Customer[] = jsonData.map((record, index) => {
          const id = record.id || `csv_gen_id_${index}`;
          const name = record.name || 'N/A';
          const email = record.email || 'N/A';
          const totalSpent = parseFloat(record.total_spent);
          const purchaseCount = parseInt(record.purchase_count, 10);
          const rawLastPurchaseDate = record.last_purchase_date;

          if (isNaN(totalSpent) || totalSpent < 0) {
            throw new Error(`Invalid total_spent value "${record.total_spent}" for ${name} (ID: ${id}) at row ${index + 2}. Must be a non-negative number.`);
          }
          if (isNaN(purchaseCount) || purchaseCount < 0) {
            throw new Error(`Invalid purchase_count value "${record.purchase_count}" for ${name} (ID: ${id}) at row ${index + 2}. Must be a non-negative integer.`);
          }

          let formattedJoinDate: string;
          const parsedDate = new Date(rawLastPurchaseDate);

          if (isNaN(parsedDate.getTime())) { // Check if date is invalid
            throw new Error(`Invalid or unparseable last_purchase_date "${rawLastPurchaseDate}" for ${name} (ID: ${id}) at row ${index + 2}. Please use a common, unambiguous date format (e.g., YYYY-MM-DD, MM/DD/YYYY).`);
          } else {
            const year = parsedDate.getFullYear();
            // Add a basic sanity check for the year
            if (year < 1900 || year > 2100) {
                 throw new Error(`Unlikely year (${year}) parsed from last_purchase_date "${rawLastPurchaseDate}" for ${name} (ID: ${id}) at row ${index + 2}. Please check the date format.`);
            }
            const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
            const day = parsedDate.getDate().toString().padStart(2, '0');
            formattedJoinDate = `${year}-${month}-${day}`;
          }

          const purchases: Purchase[] = [];
          if (purchaseCount > 0 && totalSpent > 0) {
            purchases.push({
              id: `csv_purchase_${id}_1`, // Ensure unique purchase ID
              date: formattedJoinDate, // Use the formatted date
              amount: totalSpent / purchaseCount, // Average amount per purchase
              items: [`${purchaseCount} items (averaged)`]
            });
            // If we want to represent each purchase, we might need more detailed data or make assumptions
            // For now, let's create one representative purchase or multiple with averaged amounts.
            // If totalSpent is high and purchaseCount is 1, it's one purchase.
            // If purchaseCount > 1, this creates one purchase summarizing the count.
            // Alternative: create 'purchaseCount' purchases, each with amount totalSpent/purchaseCount
            // For simplicity with LTV prompt, one main purchase date (last purchase) is often key.
            // The prompt uses purchase history, so providing one entry reflecting the latest activity.
          } else if (totalSpent > 0) { // If purchaseCount is 0 or invalid but totalSpent is valid
             purchases.push({
              id: `csv_purchase_${id}_single`,
              date: formattedJoinDate,
              amount: totalSpent,
            });
          }


          return {
            id,
            name,
            email,
            joinDate: formattedJoinDate, // Use the formatted date as join date
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FFDF00&color=004040&rounded=true&size=64`, // HERE AND NOW AI: Primary bg, Secondary text
            purchases,
            predictedLTV: undefined,
            segment: CustomerSegment.UNKNOWN,
            retentionStrategies: undefined,
            marketingIdeas: undefined,
            totalSpentCSV: totalSpent,
            purchaseCountCSV: purchaseCount,
            lastPurchaseDateCSV: rawLastPurchaseDate, // Store original string
          };
        });
        resolve(customers);
      } catch (error) {
        console.error("Error processing CSV data: ", error);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };
    reader.onerror = (error) => {
      console.error("FileReader error: ", error);
      reject(new Error("Failed to read the file."));
    };
    reader.readAsText(file);
  });
};

export const exportCustomersToCsv = (customers: Customer[], fileName: string) => {
  if (!customers.length) return;

  const headers = [
    'id', 'name', 'email', 'joinDate', 
    'totalSpentCSV', 'purchaseCountCSV', 'lastPurchaseDateCSV', 
    'predictedLTV', 'segment', 
    'retentionStrategy1', 'retentionStrategy2', 'retentionStrategy3',
    'marketingIdea1', 'marketingIdea2', 'marketingIdea3'
  ];
  
  const csvRows = [headers.join(',')];

  customers.forEach(customer => {
    const escapeCsvField = (field: string | number | undefined): string => {
      if (field === undefined || field === null) return '';
      const str = String(field);
      // If the string contains a comma, double quote, or newline, wrap it in double quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`; // Escape existing double quotes by doubling them
      }
      return str;
    };

    const row = [
      escapeCsvField(customer.id),
      escapeCsvField(customer.name),
      escapeCsvField(customer.email),
      escapeCsvField(customer.joinDate),
      escapeCsvField(customer.totalSpentCSV?.toFixed(2)),
      escapeCsvField(customer.purchaseCountCSV),
      escapeCsvField(customer.lastPurchaseDateCSV),
      escapeCsvField(customer.predictedLTV?.toFixed(2)),
      escapeCsvField(customer.segment),
      escapeCsvField(customer.retentionStrategies?.[0]),
      escapeCsvField(customer.retentionStrategies?.[1]),
      escapeCsvField(customer.retentionStrategies?.[2]),
      escapeCsvField(customer.marketingIdeas?.[0]),
      escapeCsvField(customer.marketingIdeas?.[1]),
      escapeCsvField(customer.marketingIdeas?.[2]),
    ];
    csvRows.push(row.join(','));
  });

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
  }
};