**Ant colony optimization** (ACO) searches for good paths through a graph the way foraging ants do. Artificial ants build solutions step by step, choosing edges with probability weighted by pheromone and by a heuristic such as inverse distance.

## Choosing the next step

$$
p_{ij} = \frac{\tau_{ij}^{\alpha}\, \eta_{ij}^{\beta}}{\sum_{l \in N_i} \tau_{il}^{\alpha}\, \eta_{il}^{\beta}}
$$

where $\tau$ is pheromone, $\eta$ the heuristic desirability, and $\alpha, \beta$ set their balance.

## Reinforcement

After each iteration, ants deposit pheromone in proportion to the quality of the tours they found, so short tours are reinforced.

## Evaporation

TODO (draft): explain the evaporation rate $\rho$ and why it prevents premature convergence.
