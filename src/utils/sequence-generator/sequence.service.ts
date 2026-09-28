import * as fs from 'fs';
import * as path from 'path';

let generatedNumbers = [];

export function generateReferralSequence(): string {
  const possibleVals = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const sequenceLength = 6;
  let sequence = '';

  for (let i = 0; i < sequenceLength; i++) {
    sequence += possibleVals[Math.floor(Math.random() * 26)];
  }
  sequence += Math.floor(Math.random() * 1000).toString();
  return sequence;
}

export function generateTrainerSequence(): string {
  const STORAGE_FILE_PATH = path.join(__dirname, './trainer.json');
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1; // Months are zero-based
  const year = currentDate.getFullYear();
  const formattedDate = `${day.toString().padStart(2, '0')}-${month
    .toString()
    .padStart(2, '0')}-${year}`;
  let sequenceNumber = Math.floor(Math.random() * 10000); // Generate a random number between 0 and 9999
  // heck if the number has already been generated for the current date
  let existingNumbers = generatedNumbers.filter((item) => {
    const number = item.number;
    return number === sequenceNumber;
  });

  // If the number has already been generated, generate a new one
  while (existingNumbers.length > 0) {
    sequenceNumber = Math.floor(Math.random() * 10000);
    existingNumbers = generatedNumbers.filter((item) => {
      const number = item.number;
      return number === sequenceNumber;
    });
  }
  const formattedSequence = sequenceNumber.toString().padStart(4, '0'); // Pad the sequence number with leading zeros if necessary
  const sequence = `DLA-TRN-${formattedDate}-${formattedSequence}`;
  generatedNumbers.push({ date: formattedDate, number: sequenceNumber });
  saveGeneratedNumbers(STORAGE_FILE_PATH, generatedNumbers);
  loadGeneratedNumbers(STORAGE_FILE_PATH);
  return sequence;
}

export function generateQuerySequence(): string {
  const STORAGE_FILE_PATH = path.join(__dirname, './student.json');
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1; // Months are zero-based
  const year = currentDate.getFullYear();
  const formattedDate = `${day.toString().padStart(2, '0')}-${month
    .toString()
    .padStart(2, '0')}-${year}`;
  let sequenceNumber = Math.floor(Math.random() * 10000); // Generate a random number between 0 and 9999
  // heck if the number has already been generated for the current date
  let existingNumbers = generatedNumbers.filter((item) => {
    const number = item.number;
    return number === sequenceNumber;
  });

  // If the number has already been generated, generate a new one
  while (existingNumbers.length > 0) {
    sequenceNumber = Math.floor(Math.random() * 10000);
    existingNumbers = generatedNumbers.filter((item) => {
      const number = item.number;
      return number === sequenceNumber;
    });
  }
  const formattedSequence = sequenceNumber.toString().padStart(4, '0'); // Pad the sequence number with leading zeros if necessary
  const sequence = `DLAQ${formattedDate}${formattedSequence}`;
  generatedNumbers.push({ date: formattedDate, number: sequenceNumber });
  saveGeneratedNumbers(STORAGE_FILE_PATH, generatedNumbers);
  loadGeneratedNumbers(STORAGE_FILE_PATH);
  return sequence;
}

export function generateInvoiceSequence(): string {
  const STORAGE_FILE_PATH = path.join(__dirname, './student.json');
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1; // Months are zero-based
  const year = currentDate.getFullYear();
  const formattedDate = `${day.toString().padStart(2, '0')}-${month
    .toString()
    .padStart(2, '0')}-${year}`;
  let sequenceNumber = Math.floor(Math.random() * 10000); // Generate a random number between 0 and 9999
  // heck if the number has already been generated for the current date
  let existingNumbers = generatedNumbers.filter((item) => {
    const number = item.number;
    return number === sequenceNumber;
  });

  // If the number has already been generated, generate a new one
  while (existingNumbers.length > 0) {
    sequenceNumber = Math.floor(Math.random() * 10000);
    existingNumbers = generatedNumbers.filter((item) => {
      const number = item.number;
      return number === sequenceNumber;
    });
  }
  const formattedSequence = sequenceNumber.toString().padStart(4, '0'); // Pad the sequence number with leading zeros if necessary
  const sequence = `DL#${formattedDate}${formattedSequence}`;
  generatedNumbers.push({ date: formattedDate, number: sequenceNumber });
  saveGeneratedNumbers(STORAGE_FILE_PATH, generatedNumbers);
  loadGeneratedNumbers(STORAGE_FILE_PATH);
  return sequence;
}

export function generateStudentSequence(): string {
  const STORAGE_FILE_PATH = path.join(__dirname, './student.json');
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1; // Months are zero-based
  const year = currentDate.getFullYear();
  const formattedDate = `${day.toString().padStart(2, '0')}-${month
    .toString()
    .padStart(2, '0')}-${year}`;
  let sequenceNumber = Math.floor(Math.random() * 10000); // Generate a random number between 0 and 9999
  // heck if the number has already been generated for the current date
  let existingNumbers = generatedNumbers.filter((item) => {
    const number = item.number;
    return number === sequenceNumber;
  });

  // If the number has already been generated, generate a new one
  while (existingNumbers.length > 0) {
    sequenceNumber = Math.floor(Math.random() * 10000);
    existingNumbers = generatedNumbers.filter((item) => {
      const number = item.number;
      return number === sequenceNumber;
    });
  }
  const formattedSequence = sequenceNumber.toString().padStart(4, '0'); // Pad the sequence number with leading zeros if necessary
  const sequence = `DLA-STU-${formattedDate}-${formattedSequence}`;
  generatedNumbers.push({ date: formattedDate, number: sequenceNumber });
  saveGeneratedNumbers(STORAGE_FILE_PATH, generatedNumbers);
  loadGeneratedNumbers(STORAGE_FILE_PATH);
  return sequence;
}

function saveGeneratedNumbers(STORAGE_FILE_PATH: any, generatedNumbers: any) {
  fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(generatedNumbers));
}

function loadGeneratedNumbers(STORAGE_FILE_PATH: any) {
  try {
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const formattedDate = `${day.toString().padStart(2, '0')}-${month
      .toString()
      .padStart(2, '0')}-${year}`;
    // console.log(formattedDate);
    const data = fs.readFileSync(STORAGE_FILE_PATH, 'utf8');
    // console.log(data);

    // console.log(
    //   'load',
    //   JSON.parse(data).filter(
    //     (item: { date: string }) => item.date === formattedDate,
    //   ),
    // );
    generatedNumbers = JSON.parse(data).filter(
      (item: { date: string }) => item.date === formattedDate,
    );
    // console.log(generatedNumbers);
  } catch (err) {
    generatedNumbers = [];
  }
}
