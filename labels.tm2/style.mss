@iso: '[ISO_A3]';

@sans: 'Source Sans Pro Regular';
@sans_italic: 'Source Sans Pro Italic';
@sans_bold: 'Source Sans Pro Semibold';

#centroids {
  [zoom>3] {
    text-name: @iso;
    text-face-name: @sans_bold;
    text-fill: white;
    text-size: 12; 
    text-halo-radius: 1;
    text-halo-fill: fadeout(#555, 50%);
    text-halo-rasterizer: fast;
    text-avoid-edges: true;
  }
  [zoom<=3][@iso != 'BDI']
  [@iso != 'SLE'][@iso != 'CIV']
  [@iso != 'VNM'][@iso != 'NIC']{
    text-name: @iso;
    text-face-name: @sans_bold;
    text-fill: white;
    text-size: 12;
    text-halo-radius: 1;
    text-halo-fill: #555;
    text-halo-opacity: 0.5;
    text-avoid-edges: true;
  }
}

