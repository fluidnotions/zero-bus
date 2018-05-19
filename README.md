patter matching service bus over local area networks 

- works without administration or configuration
- Peers can join or leave the network at any time
- Peers can communicate directly with each other; no central server or message broker needed
- Peer discovery usually takes less than a second

very simple minimal implementation zb instances register services, allow actions to be dispatched to all peer zb instances, where the action pattern matches a registered service, it is executed and an optional response promise resolved.   
