Feature: Petstore Mock Server — Stateful In-Memory CRUD

  # ============================================================================
  # Karate's built-in mock server (karate-netty).
  # Started by MockRunner.java via MockServer.feature(...).http(PORT).build().
  #
  # The Background block executes ONCE when the server boots.
  # All variables defined here are SHARED across every request handler —
  # mutations from one Scenario are visible to all subsequent requests,
  # enabling a fully stateful in-memory store without any external dependency.
  #
  # Scenario matching rules (evaluated TOP-TO-BOTTOM, first match wins):
  #   pathMatches(pattern)  — path template with {param} placeholders
  #   methodIs(verb)        — case-insensitive HTTP method check
  #   paramValue(name)      — reads the first value of a query parameter
  #   requestHeaders[key]   — read a request header value
  #   request               — parsed request body (JSON → JS object)
  #   pathParams            — map of {param} → value from the URL
  # ============================================================================

  Background:
    # In-memory pet store: petId (string) → pet object
    * def db      = {}
    # Auto-increment counter: use an object so the closure captures the reference
    * def seq     = { next: 9000000 }

  # ─────────────────────────────────────────────────────────────────────────────
  # POST /v2/pet — Create
  # ─────────────────────────────────────────────────────────────────────────────
  Scenario: pathMatches('/v2/pet') && methodIs('post')
    * def newId   = request.id > 0 ? request.id : seq.next++
    * def newPet  =
      """
      {
        "id"        : #(newId),
        "category"  : #(request.category || { id: 0, name: 'Uncategorised' }),
        "name"      : "#(request.name)",
        "photoUrls" : #(request.photoUrls || []),
        "tags"      : #(request.tags || []),
        "status"    : "#(request.status || 'available')"
      }
      """
    * eval db['' + newId] = newPet
    * def response       = newPet
    * def responseStatus = 200

  # ─────────────────────────────────────────────────────────────────────────────
  # GET /v2/pet/findByStatus — must be declared BEFORE /v2/pet/{id} so the
  # literal segment 'findByStatus' is not mistaken for an id path parameter
  # ─────────────────────────────────────────────────────────────────────────────
  Scenario: pathMatches('/v2/pet/findByStatus') && methodIs('get')
    * def filter  = paramValue('status') || 'available'
    * def allPets = (function(){ var r = []; for (var k in db) r.push(db[k]); return r; })()
    * def matched = karate.filter(allPets, function(p){ return p.status === filter })
    * def response       = matched
    * def responseStatus = 200

  # ─────────────────────────────────────────────────────────────────────────────
  # GET /v2/pet/{id} — Read
  # ─────────────────────────────────────────────────────────────────────────────
  Scenario: pathMatches('/v2/pet/{id}') && methodIs('get')
    * def found          = db['' + pathParams.id]
    * def response       = found ? found : { type: 'error', message: 'Pet not found' }
    * def responseStatus = found ? 200 : 404

  # ─────────────────────────────────────────────────────────────────────────────
  # PUT /v2/pet — Update (full replacement)
  # ─────────────────────────────────────────────────────────────────────────────
  Scenario: pathMatches('/v2/pet') && methodIs('put')
    * def id       = '' + request.id
    * def existing = db[id]
    * eval if (existing) db[id] = request
    * def response       = existing ? request : { type: 'error', message: 'Pet not found' }
    * def responseStatus = existing ? 200 : 404

  # ─────────────────────────────────────────────────────────────────────────────
  # DELETE /v2/pet/{id}
  # ─────────────────────────────────────────────────────────────────────────────
  Scenario: pathMatches('/v2/pet/{id}') && methodIs('delete')
    * def id       = '' + pathParams.id
    * def existed  = db[id] != null
    * eval if (existed) delete db[id]
    * def response       = existed ? { code: 200, type: 'unknown', message: id } : { type: 'error', message: 'Pet not found' }
    * def responseStatus = existed ? 200 : 404

  # ─────────────────────────────────────────────────────────────────────────────
  # GET /v2/store/inventory
  # ─────────────────────────────────────────────────────────────────────────────
  Scenario: pathMatches('/v2/store/inventory') && methodIs('get')
    * def allPets    = (function(){ var r = []; for (var k in db) r.push(db[k]); return r; })()
    * def available  = karate.filter(allPets, function(p){ return p.status === 'available' }).length
    * def pending    = karate.filter(allPets, function(p){ return p.status === 'pending'   }).length
    * def sold       = karate.filter(allPets, function(p){ return p.status === 'sold'      }).length
    * def response       = { available: '#(available)', pending: '#(pending)', sold: '#(sold)' }
    * def responseStatus = 200

  # ─────────────────────────────────────────────────────────────────────────────
  # Catch-all — 404 for any unmatched route
  # ─────────────────────────────────────────────────────────────────────────────
  Scenario:
    * def response       = { type: 'error', message: 'Route not found: ' + requestUri }
    * def responseStatus = 404
