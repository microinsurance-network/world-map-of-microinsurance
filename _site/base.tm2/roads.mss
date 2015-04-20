Map { background-color: #fff; }

#admin[admin_level=2][maritime=0] {
  line-join: round;
  line-color: #ccc;
  line-width: 1;
  [zoom>=5] { line-width: 1.4; }
  [zoom>=6] { line-width: 1.8; }
  [zoom>=8] { line-width: 2; }
  [zoom>=10] { line-width: 3; }
  [disputed=1] { line-dasharray: 4,4; } 
}

#water {
  line-join: round;
  line-color: #ccc;
  line-width: 1;
  polygon-fill: #ECF4F9;
}


