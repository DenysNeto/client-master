import { of,Observable } from 'rxjs';

export default {
  createStage: (options) => {
    return of({
      width: options.width,
      height: options.height,
    });
  },

  createGroup: (options) => {
    return of({
      x: options.x,
      y: options.y,
      draggable: options.draggable || false,
    });
  },

  createLine: (options) => {
    return of({
      points: [options.x1, options.y1, options.x2, options.y2, options.x3, options.y3],
      stroke: 'orange',
      strokeWidth: options.strokeWidth || 1,
    });
  },

  createPath: (options) => {
    return of({
      x: options.x,
      y: options.y,
      data: options.data || '',
      stroke: options.stroke,
      opacity: options.opacity,
      strokeWidth: options.strokeWidth || 1,
    });
  },

  createCircle: (options) => {
    return of({
      x: options.x,
      y: options.y,
      radius: options.radius,
      fill: options.fill,
      stroke: options.stroke,
      strokeWidth: options.strokeWidth,
    });
  },

  createText: (options) => {
    return of({
      x: options.x,
      y: options.y,
      text: options.text,
      fontSize: options.fontSize,
      fontFamily: options.fontFamily,
      fill: options.fill,
    });
  },

  createRect: (options) => {
    return of({
      width: options.width,
      height: options.height,
      fill: options.fill,
      stroke: options.stroke,
      strokeWidth: options.strokeWidth,
      x: options.x,
      y: options.y,
      opacity: options.opacity,
      cornerRadius: options.cornerRadius,
      type: options.type,
    });
  },

  createImage: (options) => {
    var image = new Image();
    image.src = options.path || 'https://developer.mozilla.org/static/img/favicon72.cc65d1d762a0.png';

    return of({
      width: options.width,
      height: options.height,
      image: image,
      x: options.x,
      y: options.y,
    });
  },


  generateLinkPath: (origX,origY, destX, destY, sc) => {
    var dy = destY-origY;
    var dx = destX-origX;
    var delta = Math.sqrt(dy*dy+dx*dx);
    var scale = 0.75;
    var scaleY = 0;

	var node_width = 100;
	var node_height = 30;


    if (dx*sc > 0) {
        if (delta < node_width) {
            scale = 0.75-0.75*((node_width-delta)/node_width);
            // scale += 2*(Math.min(5*node_width,Math.abs(dx))/(5*node_width));
            // if (Math.abs(dy) < 3*node_height) {
            //     scaleY = ((dy>0)?0.5:-0.5)*(((3*node_height)-Math.abs(dy))/(3*node_height))*(Math.min(node_width,Math.abs(dx))/(node_width)) ;
            // }
        }
    } else {
        scale = 0.4-0.2*(Math.max(0,(node_width-Math.min(Math.abs(dx),Math.abs(dy)))/node_width));
    }
    if (dx*sc > 0) {
        return "M "+origX+" "+origY+
            " C "+(origX+sc*(node_width*scale))+" "+(origY+scaleY*node_height)+" "+
            (destX-sc*(scale)*node_width)+" "+(destY-scaleY*node_height)+" "+
            destX+" "+destY
    } else {

        var midX = Math.floor(destX-dx/2);
        var midY = Math.floor(destY-dy/2);
        //
        if (dy === 0) {
            midY = destY + node_height;
        }
        var cp_height = node_height/2;
        var y1 = (destY + midY)/2
        var topX =origX + sc*node_width*scale;
        var topY = dy>0?Math.min(y1 - dy/2 , origY+cp_height):Math.max(y1 - dy/2 , origY-cp_height);
        var bottomX = destX - sc*node_width*scale;
        var bottomY = dy>0?Math.max(y1, destY-cp_height):Math.min(y1, destY+cp_height);
        var x1 = (origX+topX)/2;
        var scy = dy>0?1:-1;
        var cp = [
            // Orig -> Top
            [x1,origY],
            [topX,dy>0?Math.max(origY, topY-cp_height):Math.min(origY, topY+cp_height)],
            // Top -> Mid
            // [Mirror previous cp]
            [x1,dy>0?Math.min(midY, topY+cp_height):Math.max(midY, topY-cp_height)],
            // Mid -> Bottom
            // [Mirror previous cp]
            [bottomX,dy>0?Math.max(midY, bottomY-cp_height):Math.min(midY, bottomY+cp_height)],
            // Bottom -> Dest
            // [Mirror previous cp]
            [(destX+bottomX)/2,destY]
        ];
        if (cp[2][1] === topY+scy*cp_height) {
            if (Math.abs(dy) < cp_height*10) {
                cp[1][1] = topY-scy*cp_height/2;
                cp[3][1] = bottomY-scy*cp_height/2;
            }
            cp[2][0] = topX;
        }




        return "M "+origX+" "+origY+
            " C "+
               cp[0][0]+" "+cp[0][1]+" "+
               cp[1][0]+" "+cp[1][1]+" "+
               topX+" "+topY+
            " S "+
               cp[2][0]+" "+cp[2][1]+" "+
               midX+" "+midY+
           " S "+
              cp[3][0]+" "+cp[3][1]+" "+
              bottomX+" "+bottomY+
            " S "+
                cp[4][0]+" "+cp[4][1]+" "+
                destX+" "+destY
    }
  },


  getHorizontalLineInfo: (i) => {
    return of({
      points: [0, 20*i, 5000, 20*i], //  [x1, y1, x2, y2, x3, y3]
      stroke: '#eee',
      strokeWidth: 1,
      // lineCap: 'round',
      // lineJoin: 'round',
    })
  },
  getVerticallLineInfo: (i) => {
    return of({
      points: [20*i, 0, 20*i, 5000], //  [x1, y1, x2, y2, x3, y3]
      // y1="0" y2="5000" [attr.x1]="20*i" [attr.x2]="20*i"
      stroke: '#eee',
      strokeWidth: 1,
      // lineCap: 'round',
      // lineJoin: 'round',
    })
  },


}

