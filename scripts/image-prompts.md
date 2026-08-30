# Picture-description asset prompts

The nine files in `public/images/questions` were generated with the built-in image-generation tool using the `photorealistic-natural` workflow. Every prompt requested a landscape 3:2 editorial photograph, clear observable action, natural proportions and lighting, and no logos, readable text, watermark, or overlay.

1. `office-window`: a professional woman beside a large office window speaking on a mobile phone.
2. `market-crates`: a vendor arranging fresh fruit in wooden crates at an outdoor market.
3. `train-platform`: two travelers checking a posted timetable on a railway platform.
4. `restaurant-table`: a server setting cutlery on an empty restaurant table.
5. `warehouse-boxes`: a warehouse employee scanning a label on stacked boxes.
6. `park-bench`: a man reading a newspaper on a park bench beside a bicycle.
7. `meeting-room`: four coworkers watching a presentation in a meeting room.
8. `bakery-counter`: a baker placing loaves on a display shelf.
9. `airport-luggage`: travelers collecting suitcases beside an airport baggage carousel.

Regenerate assets one at a time with those scene constraints, inspect each result, then run `node scripts/optimize-images.mjs <source-directory>`.
