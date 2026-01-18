
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatingService, Profile, ChatMessage } from './services/dating.service';
import { ProfileCardComponent } from './components/profile-card.component';
import { ChatViewComponent } from './components/chat-view.component';

type View = 'discover' | 'matches' | 'chat' | 'create-match';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, NgOptimizedImage, ProfileCardComponent, ChatViewComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private datingService = inject(DatingService);

  // App State
  currentView = signal<View>('discover');
  
  // Data State
  profiles = signal<Profile[]>([]);
  matches = signal<Profile[]>([]);
  chatHistories = signal<Record<string, ChatMessage[]>>({});
  
  // Selection State
  activeProfileIndex = signal(0);
  activeMatchId = signal<string | null>(null);
  
  // Loading & UI State
  isLoading = signal(false);
  isCreatingMatch = signal(false);
  dreamMatchPrompt = signal('');

  // Computed
  currentProfile = computed(() => {
    const list = this.profiles();
    const idx = this.activeProfileIndex();
    return idx < list.length ? list[idx] : null;
  });

  activeMatch = computed(() => {
    const id = this.activeMatchId();
    return this.matches().find(m => m.id === id) || null;
  });

  activeChatMessages = computed(() => {
    const id = this.activeMatchId();
    if (!id) return [];
    return this.chatHistories()[id] || [];
  });
  
  isMatchTyping = signal(false);

  constructor() {
    this.loadInitialProfiles();
  }

  async loadInitialProfiles() {
    this.isLoading.set(true);
    const newProfiles = await this.datingService.generateInitialProfiles(5);
    this.profiles.set(newProfiles);
    this.isLoading.set(false);
  }

  handleLike() {
    const profile = this.currentProfile();
    if (profile) {
      this.matches.update(prev => [profile, ...prev]);
      // Initialize chat history
      this.chatHistories.update(prev => ({
        ...prev,
        [profile.id]: []
      }));
    }
    this.nextProfile();
  }

  handlePass() {
    this.nextProfile();
  }

  private nextProfile() {
    const currentIdx = this.activeProfileIndex();
    const total = this.profiles().length;
    
    if (currentIdx >= total - 2) {
      // Load more in background if running low
      this.loadMoreProfiles();
    }
    
    this.activeProfileIndex.set(currentIdx + 1);
  }

  async loadMoreProfiles() {
    const newProfiles = await this.datingService.generateInitialProfiles(3);
    this.profiles.update(prev => [...prev, ...newProfiles]);
  }

  openChat(match: Profile) {
    this.activeMatchId.set(match.id);
    this.currentView.set('chat');
  }

  async handleSendMessage(text: string) {
    const match = this.activeMatch();
    if (!match) return;

    // Add User Message
    const userMsg: ChatMessage = { sender: 'user', text, timestamp: Date.now() };
    this.updateChatHistory(match.id, userMsg);

    // Simulate thinking/replying
    this.isMatchTyping.set(true);
    
    const history = this.chatHistories()[match.id];
    const replyText = await this.datingService.generateChatResponse(match, history, text);
    
    this.isMatchTyping.set(false);

    // Add Match Reply
    const matchMsg: ChatMessage = { sender: 'match', text: replyText, timestamp: Date.now() };
    this.updateChatHistory(match.id, matchMsg);
  }

  private updateChatHistory(matchId: string, msg: ChatMessage) {
    this.chatHistories.update(prev => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), msg]
    }));
  }

  backToMatches() {
    this.currentView.set('matches');
    this.activeMatchId.set(null);
  }

  // Dream Match Logic
  toggleCreateMatch() {
    this.currentView.set('create-match');
    this.dreamMatchPrompt.set('');
  }

  async createDreamMatch() {
    if (!this.dreamMatchPrompt().trim()) return;

    this.isCreatingMatch.set(true);
    const profile = await this.datingService.createDreamMatch(this.dreamMatchPrompt());
    this.isCreatingMatch.set(false);

    if (profile) {
      // Add to front of stack and show
      this.profiles.update(prev => [profile, ...prev]);
      // Reset index to 0 effectively if we insert at current, but let's just insert at current index
      const idx = this.activeProfileIndex();
      const currentProfiles = this.profiles();
      
      // If we are at the end, append. If in middle, splice in.
      // Easiest approach: Prepend to everything and reset index to 0 to show immediately.
      this.profiles.set([profile, ...this.profiles()]);
      this.activeProfileIndex.set(0);
      
      this.currentView.set('discover');
    }
  }

  // Navigation Helpers
  setView(view: View) {
    this.currentView.set(view);
  }
}
