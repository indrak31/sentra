# SENTRA Emergency Resource Optimization Engine

## 1. Mathematical Formulation
SENTRA utilizes **Google OR-Tools** (using SCIP / CBC Mixed-Integer Programming solvers) to solve the multi-facility emergency resource allocation problem under capacity and accessibility constraints.

---

## 2. Decision Variables

Let:
- $D = \{1, \dots, n\}$ be the set of demand locations.
- $S = \{1, \dots, m\}$ be the set of available emergency supply items / resource facilities.
- $x_{i, j} \in \mathbb{Z}_{\ge 0}$ be the discrete integer quantity of resource $j \in S$ allocated to satisfy demand point $i \in D$.

---

## 3. Constraints

### 3.1 Resource Type Compatibility
Resource $j$ can only be assigned to demand $i$ if their resource types match:
$$x_{i, j} = 0 \quad \forall (i, j) \text{ where } \text{Type}(i) \ne \text{Type}(j)$$
*Example: An ambulance resource cannot be allocated to satisfy hospital bed demand.*

### 3.2 Supply Capacity Limit
Total units allocated from resource $j$ cannot exceed its currently available capacity:
$$\sum_{i \in D} x_{i, j} \le \text{Capacity}_j \quad \forall j \in S$$

### 3.3 Demand Limit
Total units allocated to demand point $i$ cannot exceed the demanded quantity:
$$\sum_{j \in S} x_{i, j} \le \text{Demanded}_i \quad \forall i \in D$$

### 3.4 Maximum Travel Time Cutoff
If travel time between demand $i$ and resource $j$ exceeds maximum allowable limit $T_{\max}$:
$$x_{i, j} = 0 \quad \text{if } \text{TravelTime}_{i, j} > T_{\max}$$

### 3.5 Nonnegativity and Integrality
$$x_{i, j} \ge 0, \quad x_{i, j} \in \mathbb{Z}$$

---

## 4. Objective Function

### Primary Objective: Maximize Weighted Demand Served (Minimize Unmet Demand)
$$\max \sum_{i \in D} \sum_{j \in S} \left( w_i \cdot 100 - \epsilon \cdot \text{TravelTime}_{i, j} \right) \cdot x_{i, j}$$

Where:
- $w_i \in [0.1, 10.0]$ is the priority weight of demand point $i$ (e.g. prioritizing high-vulnerability communities).
- $\epsilon = 0.01$ is a small penalty factor ensuring closer facilities are preferred when priorities are equal, without distorting critical priority boundaries.

---

## 5. Solver Outputs & Metrics

The solver returns:
1. **Solver Status**: `OPTIMAL`, `FEASIBLE`, `INFEASIBLE`, or `FAILED`.
2. **Objective Value**: Maximized priority score.
3. **Planned Allocations**: Array of `{demand_id, resource_id, resource_name, resource_type, allocated_quantity}`.
4. **Unmet Demand**: Quantity of unmet units per demand point.
5. **Unused Capacity**: Remaining available capacity per resource.
6. **Result Summary**: Total demanded, total allocated, total unmet, and percentage served.

---

## 6. Operational Safety: Separation of Proposals & Confirmations

- **Optimization runs NEVER automatically change live database inventory.**
- When triggered via `POST /api/v1/optimization/run`, the run produces proposed allocation records (`status="PROPOSED"`).
- An authorized coordinator reviews the plan and calls `POST /api/v1/optimization/allocations/{id}/confirm`.
- The confirmation endpoint locks the resource row (`SELECT ... FOR UPDATE`), validates available capacity, decrements capacity atomically, and marks the allocation as `"CONFIRMED"`.
