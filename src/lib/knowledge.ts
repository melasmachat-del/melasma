// ============================================================================
//  Knowledge - melasma learning base
//  Used on /knowledge as the main educational content
// ============================================================================

export interface KnowledgeEntry {
  stageId: number;
  title: string;
  emoji: string;
  difficulty: 'easy' | 'medium' | 'hard';
  concept: string;
  points: string[];
  source?: string;
}

export const KNOWLEDGE: KnowledgeEntry[] = [
  {
    stageId: 1,
    title: 'Definition',
    emoji: 'D',
    difficulty: 'easy',
    concept: 'Melasma is a common acquired pigmentation disorder that causes symmetric brown or gray-brown patches, usually on the face.',
    points: [
      'Melasma is not contagious and is not caused by poor hygiene.',
      'It often appears on the cheeks, forehead, upper lip, nose, and chin.',
      'The color can range from light brown to dark brown or gray-brown.',
      'It is more common in adults and is often associated with light sensitivity and hormonal influences.',
    ],
    source: 'American Academy of Dermatology; DermNet NZ; PubMed reviews on melasma',
  },
  {
    stageId: 2,
    title: 'Causes and triggers',
    emoji: 'C',
    difficulty: 'easy',
    concept: 'Melasma is influenced by multiple triggers rather than one single cause.',
    points: [
      'Ultraviolet radiation and visible light can darken existing melasma.',
      'Pregnancy, hormonal therapy, and some contraceptives may contribute in some people.',
      'Heat, friction, and irritation can also worsen pigmentation.',
      'Family history and skin type can affect susceptibility.',
    ],
    source: 'AAD patient education; StatPearls: Melasma; DermNet NZ',
  },
  {
    stageId: 3,
    title: 'Types',
    emoji: 'T',
    difficulty: 'medium',
    concept: 'Melasma is usually described as epidermal, dermal, or mixed.',
    points: [
      'Epidermal melasma is often more brown and may respond better to treatment.',
      'Dermal melasma may look gray-brown and can fade more slowly.',
      'Mixed melasma is common and contains both superficial and deeper pigment components.',
      'A dermatologist may use clinical examination or tools such as Wood lamp or dermoscopy to assess the pattern.',
    ],
    source: 'DermNet NZ; StatPearls: Melasma',
  },
  {
    stageId: 4,
    title: 'Prevention',
    emoji: 'P',
    difficulty: 'medium',
    concept: 'Prevention focuses on reducing light and irritation triggers every day.',
    points: [
      'Use broad-spectrum sunscreen every day, ideally SPF 30 or higher, and reapply when needed.',
      'Tinted sunscreens with iron oxides can help with visible light protection.',
      'Use hats, shade, and sunglasses to reduce exposure.',
      'Keep skin care gentle and avoid unnecessary scrubbing or irritation.',
    ],
    source: 'AAD sunscreen guidance; DermNet NZ; pigmentary disorder reviews',
  },
  {
    stageId: 5,
    title: 'Treatment and follow-up',
    emoji: 'L',
    difficulty: 'hard',
    concept: 'Melasma often improves with consistent treatment, but relapse is common without trigger control.',
    points: [
      'Treatment plans are usually individualized by a dermatologist.',
      'Topical agents, combination creams, and carefully selected procedures may be considered.',
      'Oral options such as tranexamic acid may be used only under medical supervision in selected patients.',
      'Any rapidly changing, itchy, painful, or unusual lesion needs in-person review to rule out other conditions.',
    ],
    source: 'AAD: Melasma treatment; StatPearls: Melasma treatment options; PubMed reviews',
  },
];

export function getKnowledge(stageId: number): KnowledgeEntry | undefined {
  return KNOWLEDGE.find(k => k.stageId === stageId);
}
