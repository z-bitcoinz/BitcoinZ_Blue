#!/usr/bin/env node

// Test address validation
const testAddresses = [
    "zs1qeey2en9n25l94l6k0dum5a94esvprvhszu4nq4uvavu8r6sph40r03zh43fgjw54gfv53tn4sn",
    "zs1hmvfk7dtqp3ncqnnerecagddltn9x408g20x3ql3vct22q0vxzmw564elfh6tjxn6hmpk45gch3",
    "t1Z5ayPGN4gmCWbBmLQX1gLMQXFWEd1s9n5",
    "t1NgfM8Fo9Pi2yD4pwSzx96kRQ9vzeqd1FX"
];

// Test the regex patterns
const saplingRegex = /^zs1[a-z0-9]{75}$/;
const transparentRegex = /^t1[a-zA-Z0-9]{33}$/;

console.log("Testing address validation:\n");

testAddresses.forEach((addr, i) => {
    console.log(`${i + 1}. ${addr}`);
    console.log(`   Length: ${addr.length}`);
    console.log(`   Is Sapling: ${saplingRegex.test(addr)}`);
    console.log(`   Is Transparent: ${transparentRegex.test(addr)}`);
    console.log("");
});
