@iso: '[ABBREV]';

@sans: 'Source Sans Pro Regular';
@sans_italic: 'Source Sans Pro Italic';
@sans_bold: 'Source Sans Pro Semibold';

#centroids {
  [zoom>3] {
    text-name: @iso;
    text-face-name: @sans;
    text-fill: #000000;
    text-halo-fill:#000000;
    text-halo-radius:1;
    text-halo-opacity:.1;
    text-size: 12; 
    text-avoid-edges: true;
  }
  [zoom<=3][@iso != 'BDI']
  [@iso != 'SLE'][@iso != 'CIV']
  [@iso != 'VNM'][@iso != 'NIC']{
      text-name: @iso;
    text-face-name: @sans;
    text-fill: #000000;
    text-halo-fill:#000000;
    text-halo-radius:1;
    text-halo-opacity:.1;
    text-size: 10; 
    text-avoid-edges: true;
  }
}


