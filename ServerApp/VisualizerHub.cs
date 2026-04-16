using Microsoft.AspNetCore.SignalR;

namespace ServerApp
{
    public class VisualizerHub : Hub
    {
        public async Task SendBeat(double intensity)
        {
            await Clients.All.SendAsync("ReceiveBeat", intensity);
        }
    }
}