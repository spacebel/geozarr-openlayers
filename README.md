# Readme - GeoZarr Extension

GeoZarr Spec aims to provides a geospatial extension to the Zarr specification (v2). Zarr specifies a protocol and format used for storing Zarr arrays, while the present extension defines **conventions** and recommendations for storing **multidimensional georeferenced grid** of geospatial observations (including rasters). 

This demo prototype provides some basic support of GeoZarr including display, subsetting, dimension discovery, multiscale (zooming overlays). 
Note that the sample data is hosted on OVH Cloud for a limited period.

Imeplemtation is based on OpenLayers v6.9  (https://openlayers.org/) and ZarrJS (https://github.com/gzuidhof/zarr.js/). 

## Document and Resources

- Specification: [Document](geozarr-spec.md) - [Change Log](https://github.com/christophenoel/geozarr-spec/wiki)
- OpenLayers Demo: [GeoZarr Visual Portrayals and OpenLayers extension](https://youtu.be/IKURmv6CVGU)
- MultiScaling Demo: [GeoZarr Serverless Visualisation and Pixel-Based Access](https://youtu.be/sKlejJcPKqQ)

## Other Demos

Demonstration Videos ([Youtube channel](https://youtube.com/playlist?list=PLzPGC4s5HQOPdeLoK1MXK6gEa1x2Az8Dn))
- Project Presentation (at WGISS-53) [GeoZarr Data Store - Context of the ESA GSTP project](https://youtu.be/NYhh66EstnY)
- Project Presentation (at DAP) [Hyperspectral Data Store and Access Project](https://youtu.be/CfmPppVR-o4)
- Demo: [GeoZarr Fast Time Series Plotting](https://youtu.be/Nt1URJqW71o)
- Demo: [GeoZarr Compute and plot NDWI index at runtime](https://youtu.be/UP0DjphdZgM)
- Demo: [GeoZarr Catalogue Integration](https://youtu.be/Nlbo3FJH8lo)
- Demo: [GeoZarr Serverless Visualisation and Pixel-Based Access](https://youtu.be/sKlejJcPKqQ)
- Comparison: [GeoZarr vs COG Performances](https://youtu.be/KGC8mLqlsCs)
- Advanced applications: soon

## License

(CC BY 4.0) : Content in this repository is licensed under a Creative Commons Attribution 4.0 International  license. Licensees may copy, distribute, display, perform and make derivative works and remixes based on it only if they give the author or licensor the credits (attribution). You can find the complete text of this license at http://creativecommons.org/licenses/by/4.0/.

GeoZarr documentation by Christophe Noël from Spacebel, supported by ScanWorld and other contributors.
