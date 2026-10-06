# Illustrations — CC BY 4.0

The source code of Pioneer Wiki · 先锋维基 is licensed under the Apache License 2.0 (see `LICENSE`).

The AI-generated illustrations are licensed separately under the
**Creative Commons Attribution 4.0 International** licence (CC BY 4.0,
https://creativecommons.org/licenses/by/4.0/). This covers every image in:

- `public/plates/` — specimen plates and the frontispiece
- `public/vignettes/` — vignettes, phylum emblems, theme sets, bookplate emblems and frames
- `public/stage/` — the five entrance plates
- `public/overture/` — the opening-titles montage
- `public/bookplate/` — marbled endpapers
- `public/catalogue/` — the family, genus and species plates of the catalogue, once reviewed

They were generated with OpenAI-compatible image models (`gpt-image-2` for the
first four entrance plates and the specimen plates, `gpt-image-2.5-sunburst` for
the annals plate); the prompts are recorded in `tools/*.json` and the model and
prompt of each generated file in its folder's `manifest.json`.

Attribution: **Pioneer Wiki · 先锋维基 (github.com/puresky271)**, CC BY 4.0.

Not included in this repository: images uploaded by members at run time
(stored in `.data/uploads`, never committed) and private, non-AI reference
material.
