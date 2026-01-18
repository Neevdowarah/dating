
import { Component, input, output } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Profile } from '../services/dating.service';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    <div class="relative w-full h-full max-w-sm mx-auto bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
      
      <!-- Image Container -->
      <div class="relative w-full h-[65%] bg-slate-900">
         @if (profile().isAiGeneratedImage) {
            <img [src]="profile().imageUrl" class="w-full h-full object-cover" alt="Profile Photo" />
         } @else {
            <img [ngSrc]="profile().imageUrl" width="400" height="600" class="w-full h-full object-cover" priority alt="Profile Photo" />
         }
         <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
      </div>

      <!-- Content -->
      <div class="absolute bottom-0 w-full h-[40%] flex flex-col justify-end p-6 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
        <div class="mb-2">
          <h2 class="text-3xl font-bold text-white flex items-baseline gap-2">
            {{ profile().name }} 
            <span class="text-xl font-normal text-slate-300">{{ profile().age }}</span>
          </h2>
          <p class="text-indigo-400 font-medium text-sm uppercase tracking-wide">{{ profile().job }}</p>
        </div>

        <p class="text-slate-300 text-sm leading-relaxed line-clamp-3 mb-4">
          {{ profile().bio }}
        </p>

        <div class="flex flex-wrap gap-2 mb-6">
          @for (interest of profile().interests; track interest) {
            <span class="px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-full text-xs text-slate-300">
              {{ interest }}
            </span>
          }
        </div>

        <!-- Actions -->
        <div class="flex justify-center gap-6 mt-auto">
          <button (click)="onPass.emit()" class="w-14 h-14 rounded-full bg-slate-800 border-2 border-rose-500 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-lg shadow-rose-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          
          <button (click)="onLike.emit()" class="w-14 h-14 rounded-full bg-slate-800 border-2 border-emerald-500 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all duration-300 shadow-lg shadow-emerald-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProfileCardComponent {
  profile = input.required<Profile>();
  onLike = output<void>();
  onPass = output<void>();
}
