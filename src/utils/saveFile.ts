import fs from 'fs';
import path from 'path';

export const saveFile = (
  data: string,
  filename: string,
  outputDirectory: string,
) => {
  const filePath = path.join(process.cwd(), `${outputDirectory}/${filename}`);

  if (!fs.existsSync(outputDirectory))
    fs.mkdirSync(outputDirectory, { recursive: true });

  try {
    fs.writeFileSync(filePath, data);
    console.log(`JSON file "${filename}" successfully saved to ${filePath}.`);
  } catch (error) {
    console.error(`Error saving JSON file "${filename}".`, error);
  }
};
