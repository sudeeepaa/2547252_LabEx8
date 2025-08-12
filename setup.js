const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log(`
Welcome to EventEase Setup!
===============================

This script will help you configure your EventEase application
with your Unsplash API key and other customizations.

`);

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setup() {
    try {
        console.log('Unsplash API Configuration');
        console.log('==============================');
        console.log('To get high-quality images for your events, you need an Unsplash API key.');
        console.log('1. Visit: https://unsplash.com/developers');
        console.log('2. Sign up for a free account');
        console.log('3. Create a new application');
        console.log('4. Copy your Access Key\n');
        
        const apiKey = await question('Enter your Unsplash API key (or press Enter to skip): ');
        
        if (apiKey.trim()) {
            const configPath = path.join(__dirname, 'public', 'js', 'unsplash-config.js');
            let configContent = fs.readFileSync(configPath, 'utf8');
            
            configContent = configContent.replace(
                /accessKey: '',/,
                `accessKey: '${apiKey.trim()}',`
            );
            
            fs.writeFileSync(configPath, configContent);
            console.log('Unsplash API key configured successfully!');
        } else {
            console.log('Skipping Unsplash API configuration. Using fallback images.');
        }

        console.log('\nCustomization Options');
        console.log('=========================');
        
        const customColors = await question('Would you like to customize the color scheme? (y/n): ');
        
        if (customColors.toLowerCase() === 'y' || customColors.toLowerCase() === 'yes') {
            console.log('\nChoose your primary brand color:');
            console.log('1. Indigo (Default) - #6366F1');
            console.log('2. Blue - #3B82F6');
            console.log('3. Purple - #8B5CF6');
            console.log('4. Green - #10B981');
            console.log('5. Red - #EF4444');
            console.log('6. Custom (enter hex code)');
            
            const colorChoice = await question('Enter your choice (1-6): ');
            
            let primaryColor = '#6366F1'; 
            switch (colorChoice) {
                case '1':
                    primaryColor = '#6366F1';
                    break;
                case '2':
                    primaryColor = '#3B82F6';
                    break;
                case '3':
                    primaryColor = '#8B5CF6';
                    break;
                case '4':
                    primaryColor = '#10B981';
                    break;
                case '5':
                    primaryColor = '#EF4444';
                    break;
                case '6':
                    const customColor = await question('Enter hex color code (e.g., #FF6B6B): ');
                    if (/^#[0-9A-F]{6}$/i.test(customColor)) {
                        primaryColor = customColor;
                    } else {
                        console.log('Invalid color format. Using default.');
                    }
                    break;
                default:
                    console.log('Invalid choice. Using default color.');
            }
            
            const cssPath = path.join(__dirname, 'public', 'css', 'custom.css');
            let cssContent = fs.readFileSync(cssPath, 'utf8');
            
            cssContent = cssContent.replace(
                /--primary-color: #6366F1;/,
                `--primary-color: ${primaryColor};`
            );
            
            fs.writeFileSync(cssPath, cssContent);
            console.log(`Primary color updated to ${primaryColor}`);
        }
        
        const customName = await question('\nWould you like to customize the app name? (y/n): ');
        
        if (customName.toLowerCase() === 'y' || customName.toLowerCase() === 'yes') {
            const appName = await question('Enter your app name: ');
            const tagline = await question('Enter a tagline (or press Enter to skip): ');
            
            if (appName.trim()) {
                const htmlPath = path.join(__dirname, 'public', 'index.html');
                let htmlContent = fs.readFileSync(htmlPath, 'utf8');
                
                htmlContent = htmlContent.replace(
                    /<title>EventEase - Premium Event Management<\/title>/,
                    `<title>${appName.trim()} - Premium Event Management</title>`
                );
                
                htmlContent = htmlContent.replace(
                    /<h1 class="text-2xl font-bold text-gradient">EventEase<\/h1>/,
                    `<h1 class="text-2xl font-bold text-gradient">${appName.trim()}</h1>`
                );
                
                if (tagline.trim()) {
                    htmlContent = htmlContent.replace(
                        /<p class="text-xs text-gray-500 -mt-1">Premium Events<\/p>/,
                        `<p class="text-xs text-gray-500 -mt-1">${tagline.trim()}</p>`
                    );
                }
                
                fs.writeFileSync(htmlPath, htmlContent);
                console.log(`App name updated to "${appName.trim()}"`);
            }
        }
        
        console.log('\nSetup Complete!');
        console.log('===================');
        console.log('Your EventEase application has been configured successfully!');
        console.log('\nNext steps:');
        console.log('1. Start your server: npm start');
        console.log('2. Open http://localhost:3000 in your browser');
        console.log('3. Enjoy your beautiful, customized event management app!');
        console.log('\n For more customization options, check out BEAUTIFUL_README.md');
        
    } catch (error) {
        console.error('Setup failed:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

setup();