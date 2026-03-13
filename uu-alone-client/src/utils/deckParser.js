import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

export const parseDeckCSV = async (csvFilePath = '/Chaos_Base_Translated.csv') => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvFilePath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const deck = [];
        const nursery = [];

        results.data.forEach((row) => {
          const name = row['Card Name (ชื่อ)']?.trim();
          const quantityStr = row['จำนวน']?.trim();
          const quantity = parseInt(quantityStr, 10);
          const type = row['Card Type']?.trim();
          const imageUrl = row['Image URL (รูปภาพ)']?.trim() || null;
          const effectText = row['Thai Translation']?.trim();

          if (!name || isNaN(quantity) || !type) return;

          for (let i = 0; i < quantity; i++) {
            const card = {
              instanceId: uuidv4(),
              name,
              type,
              imageUrl,
              effectText,
            };

            if (type.toLowerCase() === 'baby unicorn') {
              nursery.push(card);
            } else {
              deck.push(card);
            }
          }
        });

        // Shuffle deck
        const shuffledDeck = [...deck].sort(() => Math.random() - 0.5);

        resolve({ deck: shuffledDeck, nursery });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};