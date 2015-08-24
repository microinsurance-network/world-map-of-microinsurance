### Creating the source file

1. Download Natural Earth 110m Country (administrative) boundaries
2. Use QGIS to calculate the centroids
3. Get the list of countries we have data on with the following command line expression (requires download [csvkit](http://csvkit.readthedocs.org/))

    csvcut -c 2 app/assets/data/mi-data.csv | uniq | sed -E "s/(.*)/'\1',/g" | pbcopy

4. Using QGIS, selcted features by expression:

    "ISO_A3" IN ([paste the list of countries here, delete the last comma])

5. Enabled editing, invert the selection, and delete selected. Save.
6. Mapbox Studio -> Projects -> New Project -> Blank Source -> New Layer -> Select the just created shapefile/geojson -> Done
7. Save locally
8. Settings -> Upload to Mapbox

### Creating the style

1. Wait until the source finishes uploaded and processing.
2. Settings -> Create style from source
3. Style
