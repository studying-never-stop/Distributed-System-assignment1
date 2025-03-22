import { Book } from '../shared/types';
import { createBook } from '../shared/util';

// 构建五个完整的 Book 对象（含 bookId 和翻译）
export const Books: Book[] = [
  createBook({
    userId: 'user001',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    description: 'A Handbook of Agile Software Craftsmanship.',
    genre: 'Programming',
    read: true,
    rating: 5
  }),
  createBook({
    userId: 'user002',
    title: 'Atomic Habits',
    author: 'James Clear',
    description: 'Tiny changes, remarkable results.',
    genre: 'Self-help',
    read: false
  }),
  createBook({
    userId: 'user003',
    title: '1984',
    author: 'George Orwell',
    description: 'Dystopian novel about totalitarianism.',
    genre: 'Fiction',
    rating: 4
  }),
  createBook({
    userId: 'user004',
    title: 'The Lean Startup',
    author: 'Eric Ries',
    description: 'Entrepreneurship for the modern age.',
    genre: 'Business',
    read: true,
    rating: 4
  }),
  createBook({
    userId: 'user005',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    description: 'A brief history of humankind.',
    genre: 'History',
    read: false
  })
];