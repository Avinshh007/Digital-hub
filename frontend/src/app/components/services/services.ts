import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './services.html',
})
export class ServicesComponent {
  private langService = inject(LanguageService);
  t = this.langService.t;

  services = [
    {
      title: 'Laptop Repair',
      description: 'Chip-level repairs, motherboard fixes, hinge replacement, keyboard repairs, display replacements, liquid damage restoration.',
      icon: 'laptop',
      comingSoon: false
    },
    {
      title: 'Desktop Repair',
      description: 'Diagnostics, power supply troubleshooting, cooling upgrades, OS installations, custom tuning, component diagnostics.',
      icon: 'monitor',
      comingSoon: false
    },
    {
      title: 'Printer Repair',
      description: 'LaserJet and InkJet nozzle cleaning, cartridge replacement, fuser unit repairs, paper jam issues, network setup.',
      icon: 'printer',
      comingSoon: false
    },
    {
      title: 'CCTV Installation',
      description: 'Commercial and residential camera setup, NVR/DVR storage configuration, mobile remote view configuration.',
      icon: 'video',
      comingSoon: false
    },
    {
      title: 'Networking Solutions',
      description: 'Router setups, switches, firewall configurations, structural cabling, Wi-Fi coverage tuning, home or office setups.',
      icon: 'wifi',
      comingSoon: false
    },
    {
      title: 'Home Visit Service',
      description: 'Onsite repair and setup by certified hardware technicians right at your doorstep.',
      icon: 'home',
      comingSoon: true
    }
  ];
}
