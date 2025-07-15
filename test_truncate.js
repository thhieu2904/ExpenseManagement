// Test file for truncateText function
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
console.log('=== TESTING truncateText function ===\n');

const testCases = [
  // [input, maxLength, expected behavior]
  ['Ăn uống', 35, 'should return as is (short)'],
  ['Giải trí', 35, 'should return as is (short)'],
  ['Mua sắm', 35, 'should return as is (short)'],
  ['Đi lại', 35, 'should return as is (short)'],
  ['Nhà cửa', 35, 'should return as is (short)'],
  ['Y tế', 35, 'should return as is (short)'],
  ['Giáo dục', 35, 'should return as is (short)'],
  ['Khác', 35, 'should return as is (short)'],
  ['This is a very long category name that should be truncated', 35, 'should be truncated'],
  ['Short', 35, 'should return as is'],
  ['', 35, 'should return empty string'],
  [null, 35, 'should return empty string'],
  [undefined, 35, 'should return empty string'],
  ['OneVeryLongWordThatShouldBeTruncated', 35, 'should truncate at word level'],
  ['Multiple words that are long enough to exceed the limit', 35, 'should truncate at word boundary'],
];

testCases.forEach(([input, maxLength, expected]) => {
  const result = truncateText(input, maxLength);
  console.log(`Input: "${input}"`);
  console.log(`Max length: ${maxLength}`);
  console.log(`Result: "${result}"`);
  console.log(`Expected: ${expected}`);
  console.log(`Input length: ${input ? input.length : 'N/A'}`);
  console.log(`Result length: ${result ? result.length : 'N/A'}`);
  console.log('---');
});

console.log('\n=== Testing with real Vietnamese category names ===\n');

const vietnameseCategories = [
  'Ăn uống',
  'Giải trí', 
  'Mua sắm',
  'Đi lại',
  'Nhà cửa',
  'Y tế',
  'Giáo dục',
  'Khác',
  'Du lịch và nghỉ dưỡng',
  'Thiết bị điện tử và công nghệ',
  'Chăm sóc sức khỏe và làm đẹp'
];

vietnameseCategories.forEach(category => {
  const result = truncateText(category, 35);
  console.log(`"${category}" (${category.length} chars) -> "${result}" (${result.length} chars)`);
});
