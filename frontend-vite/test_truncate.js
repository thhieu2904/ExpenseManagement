// Test truncateText function
const truncateText = (text, maxLength = 30) => {
  if (!text) return '';
  
  // If text is already short enough, return as is
  if (text.length <= maxLength) return text;
  
  // Try to break at word boundaries
  const words = text.split(' ');
  let result = '';
  
  for (let i = 0; i < words.length; i++) {
    const wordToAdd = i === 0 ? words[i] : ' ' + words[i];
    
    if ((result + wordToAdd).length <= maxLength) {
      result += wordToAdd;
    } else {
      // If we can't fit this word, add ellipsis if we have something
      if (result.length > 0) {
        return result + '...';
      } else {
        // If even the first word is too long, truncate it
        return words[0].substring(0, maxLength - 3) + '...';
      }
    }
  }
  
  // If we've processed all words and they fit, return the result
  return result;
};

// Test cases
console.log('Test 1:', truncateText('Tiền ăn'));  // Should return: "Tiền ăn"
console.log('Test 2:', truncateText('Thưởng tăng ca'));  // Should return: "Thưởng tăng ca"
console.log('Test 3:', truncateText('Tiết kiệm cho mục tiêu'));  // Should return: "Tiết kiệm cho mục tiêu"
console.log('Test 4:', truncateText('Tiết kiệm cho mục tiêu mua nhà và xe hơi'));  // Should return: "Tiết kiệm cho mục tiêu..."
console.log('Test 5:', truncateText('Chi phí y tế và sức khỏe'));  // Should return: "Chi phí y tế và sức khỏe"
console.log('Test 6:', truncateText('Mua sắm'));  // Should return: "Mua sắm"

// Test with maxLength 35
console.log('\nWith maxLength 35:');
console.log('Test 7:', truncateText('Tiết kiệm cho mục tiêu mua nhà và xe hơi', 35));  // Should fit better
