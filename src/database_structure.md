Collections:
bases:
id: int
force: int
capacity: int
coordinates: array int,int
name: string
operational: bool

ships
id: int
force: int
class: string
hull: string
name: string
operational: bool
coordinates: array int,int

task forces
id: int
baseID: int
name: string
ships: array ship
deployed: bool

forces
id: int
identifier: string
name: string
ship count: int
aircraft count: int
fleet count: int
personell count: int
commander: string
established: datetime
headquarters: string
motto: string