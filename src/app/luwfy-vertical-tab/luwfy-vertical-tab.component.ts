import { Component, OnInit } from '@angular/core';
import { RegistryService } from '../services/registry.service';
import { BlocksService } from '../services/blocks.service';
import { CanvasService } from '../services/canvas.service';
import { PaletteElement, Color, Image, Category, DataStorages } from '../services/indexed-db.interface';
import { IdbService } from '../services/indexed-db.service';

@Component({
  selector: 'luwfy-vertical-tab',
  templateUrl: './luwfy-vertical-tab.component.html',
  styleUrls: ['./luwfy-vertical-tab.component.scss'],
})
export class LuwfyVerticalTabComponent implements OnInit {

  categories: Category[];
  palettes: PaletteElement[];
  colors: Color[];
  images: Image[];

  constructor(private registryService: RegistryService, private canvasService: CanvasService, private iDBService: IdbService) {
  }

  ngOnInit() {
    this.iDBService.getAllData(DataStorages.CATEGORIES).then(data => {
      if (data) {
        this.categories = data;
      }
    });
    this.iDBService.getAllData(DataStorages.IMAGES).then(data => {
      if (data) {
        this.images = data;
      }
    });
    this.iDBService.getAllData(DataStorages.COLORS).then(data => {
      if (data) {
        this.colors = data;
      }
    });
    this.iDBService.getAllData(DataStorages.PALLETE_ELEMENTS).then(data => {
      if (data) {
        this.palettes = data;
      }
    });
  }

  dragEvent(event: any) {
    let emptyImage = document.createElement('img');
    event.dataTransfer.setDragImage(emptyImage, 0, 0);
    this.registryService.setCurrentDraggableItem(event.target.id);
  }

  dragFinish(event: any) {
    this.canvasService.dragFinished.next(true);
  }

  getColor(colorId) {
    let colorData = '';
    this.colors.forEach((color: Color) => {
      if (colorId === color.id) {
        colorData = color.value;
      }
    })
    return colorData;
  }

  getImage(imageId) {
    let imageData = '';
    this.images.forEach((image: Image) => {
      if (imageId === image.id) {
        imageData = image.value;
      }
    })
    return imageData;
  }

}
