import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { RegistryService } from '../services/registry.service';
import { BlocksService } from '../services/blocks.service';
import { CanvasService } from '../services/canvas.service';
import { PaletteElement, Color, Image, Category, DataStorages } from '../services/indexed-db.interface';
import { IdbService } from '../services/indexed-db.service';


@Component({
  selector: 'luwfy-vertical-tab',
  templateUrl: './luwfy-vertical-tab.component.html',
  styleUrls: ['./luwfy-vertical-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class LuwfyVerticalTabComponent implements OnInit {
  @Input('initialInput') initialInput;;
  categories: Category[] = [];
  palettes: PaletteElement[] = [];
  paletteluwfyImageId = "fa fa-address-book";
  colors: Color[] = [];
  images: Image[] = [];

  constructor(private registryService: RegistryService, private canvasService: CanvasService, private iDBService: IdbService) {
  }




  ngOnInit() {


    this.iDBService.dataInitializationFinished.subscribe(() => {

      // this.iDBService.getAllData(DataStorages.CATEGORIES).then(data => {
      //   if (data) {
      //     this.categories = data;
      //   }
      // });
      // this.iDBService.getAllData(DataStorages.IMAGES).then(data => {
      //   if (data) {
      //     this.images = data;
      //   }
      // });
      // this.iDBService.getAllData(DataStorages.COLORS).then(data => {
      //   if (data) {
      //     this.colors = data;
      //   }
      // });
      this.iDBService.getAllData(DataStorages.PALLETE_ELEMENTS).then(data => {
        if (data) {
          this.palettes = data;
          // this.palettes.forEach(paletteElement => {


          //   paletteElement.luwfyImageId = '\&#x' + paletteElement.luwfyImageId + ';';
          //   paletteElement.luwfyImageId.replace("^\"|\"$", "")
          // }



          console.log('PALETTES', this.palettes);
        }
      });


    })

  }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.

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
    if (this.colors.length) {
      let colorData = '';
      this.colors.forEach((color: Color) => {
        if (colorId === color.id) {
          colorData = color.value;
        }
      })
      return colorData;
    }

  }

  getImage(imageId) {
    if (this.images.length) {
      let imageData = '';
      this.images.forEach((image: Image) => {
        if (imageId === image.id) {
          imageData = image.value;
        }
      })
      return imageData;
    }

  }

}
