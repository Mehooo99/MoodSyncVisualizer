using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace ServerApp
{
    public class VisualizerHub : Hub
    {
        // Maps ConnectionID to a specific Flower Index (0, 1, 2...)
        private static ConcurrentDictionary<string, int> _userFlowers = new();
        private static int _nextIndex = 0;

        public override async Task OnConnectedAsync()
        {
            int index = _nextIndex++;
            _userFlowers[Context.ConnectionId] = index;

            // Tell the new user which flower they are
            await Clients.Caller.SendAsync("AssignFlower", index);

            // Tell everyone else to update their bouquet count
            await Clients.All.SendAsync("UpdateTotalFlowers", _userFlowers.Count);

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (_userFlowers.TryRemove(Context.ConnectionId, out _))
            {
                // We re-index everyone so the bouquet stays packed together
                var remainingConnections = _userFlowers.Keys.ToList();
                _nextIndex = 0;
                foreach (var connId in remainingConnections)
                {
                    _userFlowers[connId] = _nextIndex++;
                }

                await Clients.All.SendAsync("UpdateTotalFlowers", _userFlowers.Count);
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendBeat(double intensity)
        {
            if (_userFlowers.TryGetValue(Context.ConnectionId, out int flowerIndex))
            {
                // Broadcast: "Flower #3 just hit an intensity of 0.8"
                await Clients.All.SendAsync("ReceiveRemoteBeat", flowerIndex, intensity);
            }
        }
    }
}