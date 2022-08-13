<template>
  <main>
    <section>
      <h1>Hansel's Climbing Gear</h1>
      <h2 class="gear text-decoration-line">Climbing Shoes</h2>
      <ol>
        <li>
          La Sportiva Tarantulace Climbing Shoe
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
          >
            <svg class="mr-1.5 h-2 w-2 text-indigo-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Neutral
          </span>

          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
          >
            <svg class="mr-1.5 h-2 w-2 text-indigo-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Beginner
          </span>

          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
          >
            <svg class="mr-1.5 h-2 w-2 text-indigo-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Warmup
          </span>
        </li>
        <li>
          La Sportiva Solutions Climbing Shoe
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
          >
            <svg class="mr-1.5 h-2 w-2 text-indigo-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Aggressive
          </span>

          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
          >
            <svg class="mr-1.5 h-2 w-2 text-indigo-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Sport
          </span>

          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
          >
            <svg class="mr-1.5 h-2 w-2 text-indigo-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Main
          </span>
        </li>
        <li>
          La Sportiva Theory Climbing Shoe
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
          >
            <svg class="mr-1.5 h-2 w-2 text-indigo-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Aggressive
          </span>

          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
          >
            <svg class="mr-1.5 h-2 w-2 text-indigo-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Bouldering
          </span>
        </li>
      </ol>
      <h2 class="gear text-decoration-line">Harness</h2>
      <ol>
        <li>Black Diamond Solution Honnold Edition</li>
      </ol>

      <h2 class="gear text-decoration-line">Belay / Rappel Device</h2>
      <ol>
        <li>Belay: Black Diamond GridLock Magnetron Carabiner</li>
        <li>Belay: Beal Birdie Belay Device (Green)</li>
        <li>Rappel: Black Diamond ATC-XP Belay/Rappel Device</li>
        <li>Rappel: Black Diamond 13mm Dynex Rabbit Runner (x2)</li>
      </ol>

      <h2 class="gear text-decoration-line">Sport / Lead Climbing</h2>
      <ol>
        <li>Rope: Black Diamond 9.9 FullDry Climbing Rope 60m (Purple)</li>
        <li>
          Quickdraws: 2 x Wild Country Session Quickdraws - Package of 6
          (Purple/Green, 12 Cm)
        </li>
        <li>Edelrid Ohm Assisted Braking Device</li>
      </ol>
      <h2 class="gear text-decoration-line">Anchor / Safety System</h2>
      <ol>
        <li>Anchor: Black Diamond Positron Screwgate Carabiner 3 Pack</li>
        <li>
          Anchor / Misc Use: 4x Black Diamond Hotforge Screwgate Carabiner 3
          Pack
        </li>
        <li>Anchor: Black Diamond Link Personal Anchor System</li>
        <li>Anchor: Metolius Equalizer with Built-In Storage Pocket</li>
        <li>Rappel: Metolius 18mm Nylon Sling</li>
        <li>
          Rappel / Rescue (prusiks): Sterling 6.8mm HollowBlock2 Loop - 13.5"
          (x2)
        </li>
        <li>...</li>
      </ol>

      <h2 class="gear text-decoration-line">Bouldering</h2>
      <ol>
        <li>Bouldering: Black Diamond Drop Zone Crash Pad</li>
      </ol>

      <h2 class="gear text-decoration-line">Apparel</h2>
      <ul>
        <li>T-Shirt: Black Diamond Dirt Bag Tee - Past Season (Nov 2019)</li>
        <li>T-Shirt: Riveter Tee</li>
        <li>T-Shirt: Inner Peaks Skull Tee</li>
        <li>Approach Shoes: Black Diamond Session Shoes (Black/Gum)</li>
        <li>Bandanna: REI Co-op Out There Graphic Bandana</li>
        <li>Bandanna: Heroes Villians: Star Wars JEDI ORDER BANDANA</li>
        <li>Bandanna: Chacos Promotional Bandana</li>
        <li>...</li>
      </ul>
    </section>
    <aside></aside>
  </main>
</template>

<script>
export default {};
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

    h1 {
      color: #41b883;
      font-weight: 300;
      padding: 25px;
      background: #2c2f33;
      box-shadow: 5px 5px;
      width: 80vw;
    }
  }

  aside {
    grid-area: 1 / 2 / 2 / 3;
  }

  .gear {
    padding: 30px;
    h2 {
      text-decoration: wavy;
      font-weight: bold;
      padding: 1rem;
      font-size: larger;
      background: #2c2f33;
      box-shadow: 5px 5px;
    }
  }
  li {
    font-size: medium;
    margin-left: 2rem;
    padding: 0.55rem;
    list-style-type: circle;
  }
}
</style>
