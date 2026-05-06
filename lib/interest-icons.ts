import {
  Coffee as PhCoffee, Wine as PhWine, TennisBall, FilmSlate, Mountains, ForkKnife, YinYang,
  Palette as PhPalette, MusicNotes, AirplaneTilt, Books, Cpu as PhCpu, GameController,
  Camera as PhCamera, MaskHappy, Umbrella, MicrophoneStage, PersonSimpleSwim, Scissors as PhScissors,
  TShirt, WaveSine,
} from './phosphor-icons'

export const INTEREST_ICON_MAP: Record<string, any> = {
  '☕ Coffee': PhCoffee, '🍷 Wine': PhWine, '🎾 Tennis': TennisBall, '🎬 Movies': FilmSlate,
  '🥾 Hiking': Mountains, '🍕 Foodie': ForkKnife, '🧘 Yoga': YinYang, '🎨 Art': PhPalette,
  '🎸 Music': MusicNotes, '✈️ Travel': AirplaneTilt, '💃 Dance': MusicNotes, '📚 Books': Books,
  '💻 IT': PhCpu, '🎮 Gaming': GameController, '📷 Photography': PhCamera, '🎭 Theatre': MaskHappy,
  '🏖️ Beach': Umbrella, '🎲 Board Games': GameController, '🎤 Concerts': MicrophoneStage,
  '🏊 Swimming': PersonSimpleSwim, '🏓 Padel': TennisBall, '✂️ Crafts': PhScissors,
  '👗 Fashion': TShirt, '🏄 Water Sports': WaveSine,
}
