// ============================================
// Daily Spark Prompts - Creative story starters
// ============================================

import { DailySpark } from '../types';

export const dailySparks: DailySpark[] = [
  { text: "What if your horse discovered a secret path in the forest?", emoji: "🌲" },
  { text: "Imagine your animals are having a picnic by the river!", emoji: "🧺" },
  { text: "What adventure would happen during a snowy day on the farm?", emoji: "❄️" },
  { text: "Your favorite animal finds a mysterious treasure chest!", emoji: "💎" },
  { text: "The barn animals are planning a surprise party!", emoji: "🎉" },
  { text: "What if your horse could fly for just one day?", emoji: "✨" },
  { text: "A new baby animal arrives at the farm - what happens?", emoji: "🐣" },
  { text: "Your animals go on a camping adventure under the stars!", emoji: "⭐" },
  { text: "The farm animals discover they can talk to each other!", emoji: "💬" },
  { text: "What happens when a rainbow appears over the meadow?", emoji: "🌈" },
  { text: "Your horse wins first place at the county fair!", emoji: "🏆" },
  { text: "The animals work together to help a friend in need!", emoji: "💝" },
  { text: "A magical butterfly leads the animals to a hidden garden!", emoji: "🦋" },
  { text: "What if all the animals switched jobs for a day?", emoji: "🔄" },
  { text: "Your animals build the coziest barn ever!", emoji: "🏠" },
  { text: "A friendly dragon visits the farm!", emoji: "🐉" },
  { text: "The farm animals start a band!", emoji: "🎵" },
  { text: "Your horse makes friends with a wild deer!", emoji: "🦌" },
  { text: "What happens during the first day of spring on the farm?", emoji: "🌸" },
  { text: "The animals have a talent show!", emoji: "🌟" },
  { text: "Your favorite animal becomes a hero!", emoji: "🦸" },
  { text: "A gentle rain brings a special surprise!", emoji: "🌧️" },
  { text: "The farm animals explore an old, forgotten path!", emoji: "🗺️" },
  { text: "What if your horse could paint beautiful pictures?", emoji: "🎨" },
  { text: "The animals find a wishing well!", emoji: "⛲" },
  { text: "Your farm celebrates harvest time!", emoji: "🌾" },
  { text: "A lost kitten needs help finding its way home!", emoji: "🐱" },
  { text: "The animals have a cozy sleepover in the barn!", emoji: "😴" },
  { text: "What magic happens at sunset on the farm?", emoji: "🌅" },
  { text: "Your animals discover a hidden waterfall!", emoji: "💧" },
  { text: "The farm has its first snowfall of winter!", emoji: "🌨️" },
];

export function getDailySpark(): DailySpark {
  // Use the day of year to consistently show the same spark each day
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  return dailySparks[dayOfYear % dailySparks.length];
}
