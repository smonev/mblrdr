'use strict';

Velocity.RegisterEffect('callout.pulse6', {
    defaultDuration: 300,
    calls: [
        [ { scaleX: 1.3 }, 0.20 ],
        [ { scaleX: 1 }, 0.20 ]
    ]
});

Velocity.RegisterEffect('callout.pulseSide', {
    defaultDuration: 300,
    calls: [
        [ { scaleX: 0.1 }, 0.20 ],
        [ { scaleX: 1.05 }, 0.20 ],
        [ { scaleX: 1 }, 0.20 ]
    ]
});

Velocity.RegisterEffect('callout.pulseDown', {
    defaultDuration: 300,
    calls: [
        [ { scaleY: 0.1 }, 0.20 ],
        [ { scaleY: 1.05 }, 0.20 ],
        [ { scaleY: 1 }, 0.20 ]
    ]
});

Velocity.RegisterEffect('callout.settings', {
    defaultDuration: 300,
    calls: [
        [ { scaleY: 0.1 }, 0.20 ],
        [ { scaleY: 1.05 }, 0.20 ],
        [ { scaleY: 1 }, 0.20 ]
    ]
});


Velocity.RegisterEffect('callout.top', {
    defaultDuration: 100,
    calls: [
        [ { top: '10px', colorRed: '50%' }, 0.20 ],
        [ { colorRed: '50%' }, 0.20 ]
    ]
});

Velocity.RegisterEffect('callout.settings8', {
    defaultDuration: 200,
    calls: [
        //[ { width: '99%' }, 0.20 ],
        [ { scaleX: 1.15, scaleY: 1.15 }, 0.20 ],
        [ { scaleX: 1, scaleY: 1 }, 0.20 ]
    ]
});

