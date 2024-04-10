declare type PlantNetResponse = {
  query: {
    project: string,
    images: string[],
    organs: string[],
    includeRelatedImages: boolean,
    noReject: boolean
  },
  language: string,
  preferedReferential: string,
  switchToProject: string,
  bestMatch: string,
  results: [
    {
      score: number,
      species: {
        scientificNameWithoutAuthor: string,
        scientificNameAuthorship: string,
        scientificName: string,
        genus: {
          scientificNameWithoutAuthor: string,
          scientificNameAuthorship: string,
          scientificName: string
        },
        family: {
          scientificNameWithoutAuthor: string,
          scientificNameAuthorship: string,
          scientificName: string
        },
        commonNames: string[]
      },
      images: {
        organ: string,
        author: string,
        license: string,
        date: {
          timestamp: number,
          string: string
        },
        citation: string,
        url: {
          o: string,
          m: string,
          s: string
        }
      }[],
      gbif: {
        id: number
      },
      powo: {
        id: string
      },
      iucn: {
        id: string,
        category: string
      }
    }
  ],
  remainingIdentificationRequests: number,
  version: string
}

export default PlantNetResponse