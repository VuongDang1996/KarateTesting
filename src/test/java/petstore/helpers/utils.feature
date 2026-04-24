@ignore
Feature: Reusable Pet Utilities
  # All scenarios here are @ignore so they are skipped by the parallel runner.
  # They are invoked explicitly with Karate's `call` keyword.

  # ---------------------------------------------------------------------------
  # createPet
  # ---------------------------------------------------------------------------
  # Creates a new pet and exposes two return variables:
  #   createdPetId  — numeric ID of the created pet
  #   createdPet    — full response body
  #
  # Required call arguments:
  #   petId   — integer  (generate with `call uniqueId` before calling)
  #   name    — string
  #   status  — 'available' | 'pending' | 'sold'
  #
  # Usage:
  #   * def newId   = call uniqueId
  #   * def created = call read('classpath:petstore/utils.feature@createPet') { petId: #(newId), name: 'Buddy', status: 'available' }
  #   * def petId   = created.createdPetId
  # ---------------------------------------------------------------------------
  @createPet
  Scenario: Create a New Pet
    Given url baseUrl
    And path 'pet'
    And request
      """
      {
        "id": #(petId),
        "category": { "id": 1, "name": "Dogs" },
        "name": "#(name)",
        "photoUrls": ["https://example.com/pets/#(name).jpg"],
        "tags": [{ "id": 1, "name": "test-tag" }],
        "status": "#(status)"
      }
      """
    When method post
    Then status 200
    * def createdPetId = response.id
    * def createdPet   = response

  # ---------------------------------------------------------------------------
  # deletePet
  # ---------------------------------------------------------------------------
  # Deletes a pet and asserts the API returns HTTP 200.
  #
  # Required call argument:
  #   petId — numeric ID of the pet to delete
  #
  # Usage:
  #   * call read('classpath:petstore/utils.feature@deletePet') { petId: #(petId) }
  # ---------------------------------------------------------------------------
  @deletePet
  Scenario: Delete a Pet by ID
    Given url baseUrl
    And path 'pet', petId
    When method delete
    Then status 200

  # ---------------------------------------------------------------------------
  # createOrder
  # ---------------------------------------------------------------------------
  # Creates a new store order and exposes:
  #   createdOrderId  — numeric ID of the placed order
  #   createdOrder    — full response body
  #
  # Required call arguments:
  #   orderId  — integer (generate with `call uniqueId`)
  #   petId    — integer (must already exist in the store)
  #
  # Optional:
  #   quantity — defaults to 1 if omitted
  #
  # Usage:
  #   * def oid     = call uniqueId
  #   * def placed  = call read('classpath:petstore/utils.feature@createOrder') { orderId: #(oid), petId: #(petId) }
  #   * def orderId = placed.createdOrderId
  # ---------------------------------------------------------------------------
  @createOrder
  Scenario: Create a Store Order
    Given url baseUrl
    And path 'store/order'
    And request
      """
      {
        "id"      : #(orderId),
        "petId"   : #(petId),
        "quantity": #(quantity || 1),
        "shipDate": "#(new Date().toISOString())",
        "status"  : "placed",
        "complete": false
      }
      """
    When method post
    Then status 200
    * def createdOrderId = response.id
    * def createdOrder   = response

  # ---------------------------------------------------------------------------
  # deleteOrder
  # ---------------------------------------------------------------------------
  # Deletes a store order by ID and asserts HTTP 200.
  #
  # Required call argument:
  #   orderId — numeric ID of the order to delete
  #
  # Usage:
  #   * call read('classpath:petstore/utils.feature@deleteOrder') { orderId: #(orderId) }
  # ---------------------------------------------------------------------------
  @deleteOrder
  Scenario: Delete a Store Order by ID
    Given url baseUrl
    And path 'store/order', orderId
    When method delete
    Then status 200
