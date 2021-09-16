import * as React from 'react'
import { mount } from '@cypress/react'
import { CodeHinter } from './CodeHinter'

it('Codehinter', () => {
  mount(<CodeHinter
    currentState={{
      queries: {
        postgres: { 
          data: []
        }
      },
      components: {

      },
      globals: {

      }
    }}
    initialValue={''}
    theme="duotone-light"
    mode="javascript"
    lineNumbers={true}
    className="query-hinter"
    onChange={(value) => {}}
  />) 

  cy.get('.code-hinter')
    .click()
    .type('{{')
    .contains('{{}}') // autocomplete for dynamic variables
})
 