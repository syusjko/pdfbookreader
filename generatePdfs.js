const PDFDocument = require('pdfkit');
const fs = require('fs');

const books = [
  { id: 'en-1', title: 'Alice in Wonderland', text: 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"' },
  { id: 'en-2', title: 'Moby Dick', text: 'Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.' },
  { id: 'fr-1', title: 'Le Petit Prince', text: 'Lorsque j\'avais six ans j\'ai vu, une fois, une magnifique image, dans un livre sur la Forêt Vierge qui s\'appelait "Histoires Vécues". Ça représentait un serpent boa qui avalait un fauve.' },
  { id: 'fr-2', title: 'Les Misérables', text: 'En 1815, M. Charles-François-Bienvenu Myriel était évêque de Digne. C’était un vieillard d’environ soixante-quinze ans ; il occupait le siège de Digne depuis 1806.' },
  { id: 'ko-1', title: '어린 왕자', text: '내가 여섯 살이었을 때, "실화 이야기"라는 원시림에 관한 책에서 멋진 그림을 본 적이 있다. 그것은 맹수를 집어삼키고 있는 보아 뱀의 그림이었다.' },
  { id: 'ko-2', title: '별 헤는 밤', text: '계절이 지나가는 하늘에는 가을로 가득 차 있습니다. 나는 아무 걱정도 없이 가을 속의 별들을 다 헤일 듯합니다. 가슴 속에 하나 둘 새겨지는 별을 이제 다 못 헤는 것은 쉬이 아침이 오는 까닭이요, 내일 밤이 남은 까닭이요, 아직 나의 청춘이 다하지 않은 까닭입니다.' },
  { id: 'ja-1', title: '吾輩は猫である', text: '吾輩は猫である。名前はまだ無い。どこで生れたかとんと見当がつかぬ。何でも薄暗いじめじめした所でニャーニャー泣いていた事だけは記憶している。' },
  { id: 'ja-2', title: '羅生門', text: 'ある日の暮方の事である。一人の下人が、羅生門の下で雨やみを待っていた。広い門の下には、この男のほかに誰もいない。ただ、所々丹塗の剥げた、大きな円柱に、蟋蟀が一匹とまっている。' }
];

books.forEach(book => {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(`public/samples/${book.id}.pdf`));
  doc.font('NanumGothic.ttf')
     .fontSize(24)
     .text(book.title, { align: 'center' })
     .moveDown(2)
     .fontSize(14)
     .text(book.text, { align: 'left', lineGap: 10 });
  doc.end();
});

console.log("PDFs generated.");
