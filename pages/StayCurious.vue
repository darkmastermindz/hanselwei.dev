<template>
    <main>
        <section>
            <h1>Notes</h1>
            <div class="max-w-7xl mx-auto py-8 sm:space-x-2 sm:space-y-2 lg:space-x-4 lg:space-y-4">
                <div>
                    <h2 class="text-purple-500 hover:text-green-300">Awesome Dev References</h2>
                    <ol>
                        <li class="text-white hover:text-blue">
                            <a href="https://devhints.io" target="_blank">https://devhints.io</a>
                        </li>
                        <li class="text-white hover:text-blue">
                            <a href="https://crontab.guru" target="_blank"></a>https://crontab.guru
                        </li>
                        <li>...</li>
                    </ol>
                </div>

                <div>
                    <h2 class="text-purple-500 hover:text-green-300">
                        <a target="_blank" href="#">My Video Gear</a>
                    </h2>
                    <ol>
                        <li>Obsbot Me / iPhone 11</li>
                        <li>Snapchat Spectacles v1 (black)</li>
                        <li>Snapchat Spectacles v1 (cyan)</li>
                        <li>Snapchat Spectacles v2 (nico)</li>
                        <li>Polaroid Snap Digital Instant Camera (red)</li>
                        <li>Genki Shadowcast Capture (x2)</li>
                        <li>Logitech BRIO Webcam with 4K Ultra HD Video and HDR</li>
                        <li>Final Cut Pro</li>
                        <li>...</li>
                    </ol>
                </div>
                <div>
                    <h2 class="text-purple-500 hover:text-green-300">
                        <a target="_blank" href="#">My Climbing Gear</a>
                    </h2>
                    <ol>
                        <li>Climbing Shoes (Sport): La Sportiva Solutions</li>
                        <li>Harness: Black Diamond Solution Honnold Edition</li>
                        <li>Belay: Beal Birdie Belay Device (Green)</li>
                        <li>Rappel: Black Diamond ATC-XP Belay/Rappel Device</li>
                        <li>Belay: Black Diamond GridLock Magnetron Carabiner</li>
                        <li>Quickdraws: Wild Country Session Quickdraws - Package of 6 (Purple/Green, 12 Cm, x2)</li>
                        <li>Rope: Black Diamond 9.9 FullDry Climbing Rope 60m (Purple)</li>
                        <li>Anchor: Black Diamond Positron Screwgate Carabiner 3 Pack</li>
                        <li>Anchor / Misc: Black Diamond Hotforge Screwgate Carabiner 3 Pack (x4)</li>
                        <li>Anchor: Black Diamond Link Personal Anchor System</li>
                        <li>Rappel: Black Diamond 13mm Dynex Rabbit Runner (x2)</li>
                        <li>Bouldering: Black Diamond Drop Zone Crash Pad</li>
                        <li>T-Shirt: Black Diamond Dirt Bag Tee - Past Season (Nov 2019)</li>
                        <li>Approach Shoes: Black Diamond Session Shoes (Black/Gum)</li>
                        <li>Anchor: Metolius Equalizer with Built-In Storage Pocket</li>
                        <li>Rappel: Metolius 18mm Nylon Sling</li>
                        <li>Rappel / Rescue (replaces prusiks): Sterling 6.8mm HollowBlock2 Loop - 13.5" (x2)</li>
                        <li>Bandanna: REI Co-op Out There Graphic Bandana</li>
                        <li>Bandanna: Heroes Villians: Star Wars JEDI ORDER BANDANA</li>
                        <li>Bandanna: Chacos Promotional Bandana</li>
                        <li>...</li>
                    </ol>
                </div>
            </div>
        </section>
        <aside></aside>
    </main>
</template>

<script>
export default {

}
</script>

<style lang="scss" scoped>
main {
    width: 80vw;
    margin: 2% 8%;
    display: grid;
    grid-template-columns: 2fr 1fr;
    grid-template-rows: 1fr;
    grid-column-gap: 50px;
    grid-row-gap: 0px;

    section {
        grid-area: 1 / 1 / 2 / 2;
        background: #41b883;
        color: white;
        padding: 30px;
        box-shadow: 5px 5px;
    }

    aside {
        grid-area: 1 / 2 / 2 / 3;
    }
}
</style>
