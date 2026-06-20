import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecentlyViewedService } from '../../services/recently-viewed.service';
import { ProductCardComponent } from '../product-card/product-card';

@Component({
  selector: 'app-recently-viewed',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './recently-viewed.html'
})
export class RecentlyViewedComponent {
  private recentlyViewedService = inject(RecentlyViewedService);

  recentlyViewed = this.recentlyViewedService.recentlyViewed;
}
