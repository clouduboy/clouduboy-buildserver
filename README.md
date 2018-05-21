# Clouduboy build server

A small express app that creates a build server and an open API for compiling MicroCanvas
JavaScript/HTML5 canvas code into Arduino-compatible C or machine code (creating the full
binary firmware), for the supported platforms.

## Platforms supported
- [Arduboy](http://clouduboy.org/platforms/arduboy) `beta`
- [Tiny Arcade](http://clouduboy.org/platforms/tiny-arcade) `experimental`
- [BBC Micro:bit](http://clouduboy.org/platforms/microbit) `experimental`
- Gamebuino `planned`
- Gamebuino Meta `planned`

## API
- `/api/v1/check`  
  Expects MicroCanvas (JS) source as POST data in `file` parameter. Checks the file for compile errors and returns the result, no polling is required for job completion.
- `/api/v1/convert`  
  Expects MicroCanvas (JS) source as POST data in `file` parameter. Returns the `clouduboy-compiler` result.
- `/api/v1/compile`  
  Does the JS->C conversion, as well as the target binary compilation, generating `clouduboy-compiler` results,
  as well as the output binary HEX/firmware image (if both the conversion & compilation were successful).
- `/api/v1/job/:jobid`  
  Both `convert` and `compile` return a "job ID". Jobs sent to convert/compile are queued up and executed in a FIFO manner. A job ID refers to these processes and clients should poll for their job completion. After a job has completed its results (JS, HEX file, etc.) are available as a static download - this endpoint returns the metadata and URLs required to see these results.



# License

> This software is licensed under the Apache License, version 2 ("ALv2"), quoted below.
>
> Copyright 2018 István Szmozsánszky, Clouduboy <https://clouduboy.org/>
>
> Licensed under the Apache License, Version 2.0 (the "License");
> you may not use this file except in compliance with the License.
> You may obtain a copy of the License at
>
> http://www.apache.org/licenses/LICENSE-2.0
>
> Unless required by applicable law or agreed to in writing, software
> distributed under the License is distributed on an "AS IS" BASIS,
> WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
> See the License for the specific language governing permissions and
> limitations under the License.
