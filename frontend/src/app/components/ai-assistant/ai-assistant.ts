import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AiAssistantService, ChatMessage } from '../../services/ai-assistant.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.css'
})
export class AiAssistantComponent implements AfterViewChecked {
  private aiService = inject(AiAssistantService);
  private cartService = inject(CartService);

  @ViewChild('chatScrollContainer') private chatScrollContainer!: ElementRef;

  isOpen = signal<boolean>(false);
  loading = signal<boolean>(false);
  messages = signal<ChatMessage[]>([
    {
      role: 'model',
      text: "Hello! I'm your  DIGITAL HUBSales Assistant. How can I help you today? I can suggest products, check stock, and answer store questions.",
      timestamp: new Date()
    }
  ]);

  suggestions = [
    "Laptops under ₹50,000",
    "SSD vs HDD explanation",
    "Show available monitors",
    "What are store timings?",
    "Check stock of SSDs"
  ];

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen.set(!this.isOpen());
  }

  async sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message
    const currentMsgs = this.messages();
    this.messages.set([
      ...currentMsgs,
      { role: 'user', text: trimmed, timestamp: new Date() }
    ]);

    this.loading.set(true);

    try {
      const response = await this.aiService.sendMessage(trimmed);
      this.messages.set([
        ...this.messages(),
        {
          role: 'model',
          text: response.text,
          products: response.products,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      this.messages.set([
        ...this.messages(),
        {
          role: 'model',
          text: "I'm sorry, I encountered an issue connecting to the server. Please check your network and try again.",
          timestamp: new Date()
        }
      ]);
    } finally {
      this.loading.set(false);
      this.scrollToBottom();
    }
  }

  handleSuggestionClick(suggestion: string) {
    this.sendMessage(suggestion);
  }

  getProductImage(product: any): string {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
    } catch (e) {}
    return '/uploads/hero_banner.jpg';
  }

  handleAddToCart(e: MouseEvent, product: any) {
    e.preventDefault();
    e.stopPropagation();
    this.cartService.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: this.getProductImage(product),
      stock: product.stock,
      sku: product.sku,
      gstRate: product.gstRate || 18,
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.chatScrollContainer) {
        this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) { }
  }
}
