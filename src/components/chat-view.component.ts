
import { Component, input, output, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Profile, ChatMessage } from '../services/dating.service';

@Component({
  selector: 'app-chat-view',
  standalone: true,
  imports: [CommonModule, FormsModule, NgOptimizedImage],
  template: `
    <div class="flex flex-col h-full bg-slate-900">
      <!-- Header -->
      <div class="flex items-center gap-3 p-4 bg-slate-800 border-b border-slate-700 shadow-md">
        <button (click)="onBack.emit()" class="p-2 text-slate-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div class="w-10 h-10 rounded-full overflow-hidden bg-slate-700 border border-slate-600">
           @if (match().isAiGeneratedImage) {
              <img [src]="match().imageUrl" class="w-full h-full object-cover" />
           } @else {
              <img [ngSrc]="match().imageUrl" width="40" height="40" class="w-full h-full object-cover" />
           }
        </div>
        <div>
          <h3 class="font-bold text-white">{{ match().name }}</h3>
          <p class="text-xs text-emerald-400 flex items-center gap-1">
            <span class="block w-2 h-2 rounded-full bg-emerald-400"></span> Online
          </p>
        </div>
      </div>

      <!-- Messages -->
      <div #scrollContainer class="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        @for (msg of messages(); track msg.timestamp) {
          <div [class]="'flex ' + (msg.sender === 'user' ? 'justify-end' : 'justify-start')">
            <div [class]="'max-w-[80%] rounded-2xl px-4 py-3 text-sm ' + 
              (msg.sender === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-slate-200 rounded-bl-none')">
              {{ msg.text }}
            </div>
          </div>
        }
        @if (isTyping()) {
          <div class="flex justify-start">
            <div class="bg-slate-700 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center">
              <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
              <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
              <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        }
      </div>

      <!-- Input -->
      <div class="p-4 bg-slate-800 border-t border-slate-700">
        <form (ngSubmit)="sendMessage()" class="flex gap-2">
          <input 
            type="text" 
            [(ngModel)]="newMessage" 
            name="message" 
            placeholder="Type a message..." 
            class="flex-1 bg-slate-900 text-white rounded-full px-5 py-3 border border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autocomplete="off"
          >
          <button 
            type="submit" 
            [disabled]="!newMessage.trim() || isTyping()"
            class="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </form>
      </div>
    </div>
  `
})
export class ChatViewComponent {
  match = input.required<Profile>();
  messages = input.required<ChatMessage[]>();
  isTyping = input<boolean>(false);
  
  onSendMessage = output<string>();
  onBack = output<void>();

  newMessage = '';

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor() {
    effect(() => {
      // Auto-scroll to bottom when messages change
      const msgs = this.messages(); // Dependency
      setTimeout(() => {
        if (this.scrollContainer) {
          this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
        }
      }, 50);
    });
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    this.onSendMessage.emit(this.newMessage);
    this.newMessage = '';
  }
}
