// Sport-specific configurations for CoachDeck

export interface SportConfig {
  name: string;
  displayName: string;
  tags: string[];
  prompt: string;
  terminology: Record<string, string>;
}

export const SPORT_CONFIGS: Record<string, SportConfig> = {
  basketball: {
    name: 'basketball',
    displayName: 'Basketball',
    tags: [
      'shot', 'pass', 'rebound', 'defense', 'fast_break', 'pick_and_roll', 
      'three_pointer', 'layup', 'dunk', 'free_throw', 'assist', 'steal',
      'block', 'turnover', 'foul', 'timeout', 'substitution'
    ],
    prompt: `Focus on basketball-specific analysis:
             - Shooting accuracy and shot selection (3-pointers, layups, free throws)
             - Ball movement and passing efficiency
             - Defensive positioning and effort
             - Rebounding on both ends
             - Fast break execution and transition defense
             - Pick and roll execution and defense
             - Team chemistry and communication
             - Game tempo and pace control`,
    terminology: {
      'score': 'points',
      'goal': 'basket',
      'field': 'court',
      'player': 'player',
      'team': 'team'
    }
  },
  
  football: {
    name: 'football',
    displayName: 'American Football',
    tags: [
      'tackle', 'pass', 'run', 'interception', 'field_goal', 'touchdown',
      'sack', 'block', 'catch', 'fumble', 'penalty', 'punt', 'kickoff',
      'conversion', 'safety', 'timeout', 'challenge'
    ],
    prompt: `Focus on football-specific analysis:
             - Tackling technique and form
             - Passing accuracy and decision making
             - Running efficiency and ball security
             - Defensive coverage and positioning
             - Special teams execution
             - Play calling and execution
             - Penalty discipline
             - Game situation awareness`,
    terminology: {
      'score': 'points',
      'goal': 'touchdown',
      'field': 'field',
      'player': 'player',
      'team': 'team'
    }
  },
  
  soccer: {
    name: 'soccer',
    displayName: 'Soccer/Football',
    tags: [
      'pass', 'shot', 'tackle', 'header', 'cross', 'free_kick', 'corner',
      'offside', 'foul', 'yellow_card', 'red_card', 'penalty', 'save',
      'dribble', 'interception', 'clearance', 'substitution'
    ],
    prompt: `Focus on soccer-specific analysis:
             - Ball control and dribbling skills
             - Passing accuracy and vision
             - Shooting technique and finishing
             - Defensive positioning and tackling
             - Set piece execution (corners, free kicks)
             - Tactical awareness and positioning
             - Fitness and work rate
             - Team shape and organization`,
    terminology: {
      'score': 'goals',
      'goal': 'goal',
      'field': 'pitch',
      'player': 'player',
      'team': 'team'
    }
  },
  
  tennis: {
    name: 'tennis',
    displayName: 'Tennis',
    tags: [
      'serve', 'volley', 'baseline', 'net_play', 'ace', 'double_fault',
      'winner', 'unforced_error', 'forehand', 'backhand', 'lob', 'drop_shot',
      'approach_shot', 'passing_shot', 'break_point', 'set_point'
    ],
    prompt: `Focus on tennis-specific analysis:
             - Serve consistency and placement
             - Groundstroke technique and consistency
             - Net play and volleying skills
             - Court positioning and movement
             - Shot selection and strategy
             - Mental game and focus
             - Fitness and endurance
             - Match tactics and game plan`,
    terminology: {
      'score': 'points',
      'goal': 'point',
      'field': 'court',
      'player': 'player',
      'team': 'player'
    }
  },
  
  esports: {
    name: 'esports',
    displayName: 'E-Sports',
    tags: [
      'gank', 'farm', 'push', 'defend', 'rotate', 'ultimate', 'combo',
      'objective', 'teamfight', 'split_push', 'ward', 'vision', 'draft',
      'macro', 'micro', 'communication', 'tilt'
    ],
    prompt: `Focus on esports-specific analysis:
             - Game sense and decision making
             - Mechanical skill and execution
             - Team coordination and communication
             - Map awareness and positioning
             - Objective control and timing
             - Draft strategy and champion selection
             - Mental game and tilt management
             - Macro and micro gameplay`,
    terminology: {
      'score': 'kills/objectives',
      'goal': 'objective',
      'field': 'map',
      'player': 'player',
      'team': 'team'
    }
  },
  
  general: {
    name: 'general',
    displayName: 'General Sports',
    tags: [
      'action', 'outcome', 'quality', 'effort', 'decision', 'execution',
      'teamwork', 'communication', 'focus', 'energy', 'strategy', 'tactics'
    ],
    prompt: `Focus on general sports analysis:
             - Overall performance and effort
             - Decision making and execution
             - Teamwork and communication
             - Focus and mental game
             - Strategy and tactics
             - Areas for improvement
             - Positive reinforcement
             - Goal setting and progress`,
    terminology: {
      'score': 'points',
      'goal': 'objective',
      'field': 'field/court',
      'player': 'player',
      'team': 'team'
    }
  }
};

export function getSportConfig(sport: string): SportConfig {
  return SPORT_CONFIGS[sport] || SPORT_CONFIGS.general;
}

export function getAvailableSports(): Array<{ name: string; displayName: string }> {
  return Object.values(SPORT_CONFIGS).map(config => ({
    name: config.name,
    displayName: config.displayName
  }));
}

export function getTagsForSport(sport: string): string[] {
  return getSportConfig(sport).tags;
}

export function getPromptForSport(sport: string): string {
  return getSportConfig(sport).prompt;
} 