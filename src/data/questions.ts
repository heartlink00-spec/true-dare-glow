export type GameMode = 'friendly' | 'crush' | 'adult';

export interface Question {
  type: 'truth' | 'dare';
  text: string;
}

export const questions: Record<GameMode, Question[]> = {
  friendly: [
    { type: 'truth', text: "What's the most embarrassing thing that happened to you in school?" },
    { type: 'truth', text: "What's your weirdest habit?" },
    { type: 'truth', text: "What's the silliest thing you've cried about?" },
    { type: 'truth', text: "What's your most irrational fear?" },
    { type: 'truth', text: "What's the worst gift you've ever received?" },
    { type: 'dare', text: "Do your best celebrity impression!" },
    { type: 'dare', text: "Speak in an accent for the next 3 rounds!" },
    { type: 'dare', text: "Do 10 jumping jacks right now!" },
    { type: 'dare', text: "Send a funny meme to a random contact!" },
    { type: 'dare', text: "Tell a joke - you can't laugh at your own joke!" },
    { type: 'truth', text: "What app do you waste the most time on?" },
    { type: 'truth', text: "What's the longest you've gone without showering?" },
    { type: 'dare', text: "Post an embarrassing childhood photo!" },
    { type: 'dare', text: "Let the other player choose your profile picture for a day!" },
    { type: 'truth', text: "What's your most used emoji?" },
  ],
  crush: [
    { type: 'truth', text: "What's your idea of a perfect date?" },
    { type: 'truth', text: "What physical feature do you find most attractive?" },
    { type: 'truth', text: "Have you ever had a crush on someone in this room?" },
    { type: 'truth', text: "What's the most romantic thing you've ever done?" },
    { type: 'truth', text: "What's your biggest turn-on?" },
    { type: 'dare', text: "Compliment the other player's best feature!" },
    { type: 'dare', text: "Send a flirty text to someone you like!" },
    { type: 'dare', text: "Share your favorite love song!" },
    { type: 'dare', text: "Describe your dream partner in 3 words!" },
    { type: 'dare', text: "Give the other player a cute nickname!" },
    { type: 'truth', text: "When was your first kiss?" },
    { type: 'truth', text: "What's the most attractive name you've heard?" },
    { type: 'dare', text: "Show off your best smile!" },
    { type: 'truth', text: "What's your love language?" },
    { type: 'dare', text: "Whisper something sweet to the other player!" },
  ],
  adult: [
    { type: 'truth', text: "What's your biggest fantasy?" },
    { type: 'truth', text: "What's the wildest place you've been intimate?" },
    { type: 'truth', text: "What's your biggest turn-off in bed?" },
    { type: 'truth', text: "Have you ever had a one-night stand?" },
    { type: 'truth', text: "What's something you've always wanted to try?" },
    { type: 'dare', text: "Describe your ideal intimate scenario!" },
    { type: 'dare', text: "Share your most daring experience!" },
    { type: 'dare', text: "Tell the other player something you find attractive about them!" },
    { type: 'dare', text: "Show your best seductive look!" },
    { type: 'dare', text: "Send a spicy text to your partner!" },
    { type: 'truth', text: "What's the most adventurous thing you've done?" },
    { type: 'truth', text: "What's your biggest secret desire?" },
    { type: 'dare', text: "Whisper something naughty to the other player!" },
    { type: 'truth', text: "What's your favorite position?" },
    { type: 'dare', text: "Do your sexiest dance move!" },
  ],
};

export const getRandomQuestion = (mode: GameMode, type: 'truth' | 'dare'): string => {
  const modeQuestions = questions[mode].filter(q => q.type === type);
  const randomIndex = Math.floor(Math.random() * modeQuestions.length);
  return modeQuestions[randomIndex].text;
};
