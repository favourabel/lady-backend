// ============================================
// Seed Script — Add videos + images
// Run: node seedWellness.js
// ============================================
require('dotenv').config();
const mongoose = require('mongoose');
const Wellness = require('./models/Wellness');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// ✅ Helper to extract YouTube video ID
const extractVideoId = (url) => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return match && match[1] ? match[1] : null;
};

// ✅ Helper to build YouTube thumbnail URL
const buildThumbnail = (videoId) => {
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
};

// ============================================
// VIDEOS
// ============================================
const rawVideos = [
  {
    type: 'video',
    title: 'Gentle Yoga for Period Cramps',
    description: 'A soothing 15-minute yoga session to ease menstrual cramps and relax your body.',
    url: 'https://www.youtube.com/watch?v=2X78NWuRfJU',
    category: 'yoga',
    duration: '15 min',
  },
  {
    type: 'video',
    title: '10 Minute Meditation for PMS',
    description: 'A guided meditation designed to help you find peace during PMS and hormonal changes.',
    url: 'https://www.youtube.com/watch?v=cXPRE_h4-nY',
    category: 'meditation',
    duration: '10 min',
  },
  {
    type: 'video',
    title: 'What Happens During Your Period Explained',
    description: 'Learn the science of what happens in your body during your menstrual cycle.',
    url: 'https://www.youtube.com/watch?v=XF4k0td-Rwg',
    category: 'education',
    duration: '8 min',
  },
  {
    type: 'video',
    title: 'Your Menstrual Cycle is Your Superpower',
    description: 'An empowering talk about embracing your menstrual cycle as a source of strength.',
    url: 'https://www.youtube.com/watch?v=BFa2egx-jI8',
    category: 'motivation',
    duration: '17 min',
  },
  {
    type: 'video',
    title: '5 Best Foods to Eat During Your Period',
    description: 'Discover the top 5 foods that help reduce cramps, bloating, and boost your mood.',
    url: 'https://www.youtube.com/watch?v=ZUC4zO9Ik2Q',
    category: 'nutrition',
    duration: '10 min',
  },
];

// ============================================
// IMAGES (Motivational)
// ============================================
const rawImages = [
  {
    type: 'image',
    title: 'You are stronger than you think',
    description: 'A reminder that you have the power within to overcome any challenge.',
    url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop',
    category: 'empowerment',
  },
  {
    type: 'image',
    title: 'Take care of yourself first, always',
    description: 'Self-care is not selfish — it is essential for your wellbeing.',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop',
    category: 'self-care',
  },
  {
    type: 'image',
    title: 'Bloom where you are planted',
    description: 'Grow into your beautiful self, one day at a time.',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop',
    category: 'motivation',
  },
  {
    type: 'image',
    title: 'Your body is a temple, honor it',
    description: 'Listen to your body and give it the love and rest it deserves.',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop',
    category: 'self-care',
  },
  {
    type: 'image',
    title: 'You are enough, exactly as you are',
    description: 'You do not need to change to be worthy of love and respect.',
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop',
    category: 'affirmation',
  },
  {
    type: 'image',
    title: 'Peace comes from within',
    description: 'True peace begins with self-acceptance and inner harmony.',
    url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop',
    category: 'motivation',
  },
  {
    type: 'image',
    title: 'Embrace your beautiful journey',
    description: 'Every step of your journey is shaping the amazing woman you are becoming.',
    url: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=800&auto=format&fit=crop',
    category: 'empowerment',
  },
  {
    type: 'image',
    title: 'Rest is productive too',
    description: 'Give yourself permission to rest without guilt.',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&auto=format&fit=crop',
    category: 'self-care',
  },
  {
    type: 'image',
    title: 'You bloom in your own time',
    description: 'Do not compare your journey to others. Your time will come.',
    url: 'https://images.unsplash.com/photo-1509909756405-be0199881695?w=800&auto=format&fit=crop',
    category: 'affirmation',
  },
  {
    type: 'image',
    title: 'Be gentle with yourself today',
    description: 'Treat yourself with the same kindness you show to those you love.',
    url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&auto=format&fit=crop',
    category: 'motivation',
  },
];

// ✅ Auto-fill videoId and thumbnail for videos
const videos = rawVideos.map((v) => {
  const videoId = extractVideoId(v.url);
  return {
    ...v,
    videoId,
    thumbnail: buildThumbnail(videoId),
  };
});

// ✅ For images, thumbnail = the image itself
const images = rawImages.map((img) => ({
  ...img,
  thumbnail: img.url,
}));

async function seedDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Removing old wellness content...');
    await Wellness.deleteMany({});

    console.log('📥 Adding videos and images...');
    const allItems = [...videos, ...images];
    const created = await Wellness.insertMany(allItems);
    
    const videoCount = created.filter(i => i.type === 'video').length;
    const imageCount = created.filter(i => i.type === 'image').length;
    
    console.log(`\n✅ Successfully added ${created.length} items!`);
    console.log(`   🎥 Videos: ${videoCount}`);
    console.log(`   🖼️  Images: ${imageCount}\n`);

    console.log('📹 VIDEOS:');
    created.filter(i => i.type === 'video').forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.title} (${v.category})`);
    });

    console.log('\n🖼️  IMAGES:');
    created.filter(i => i.type === 'image').forEach((img, i) => {
      console.log(`   ${i + 1}. ${img.title} (${img.category})`);
    });

    console.log('\n🌸 Done! Your wellness content is ready.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
    process.exit(1);
  }
}

seedDatabase();