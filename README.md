# 🚀 Termux Monad Mining Contracts

<p align="center">
  <img src="https://img.shields.io/badge/Environment-Termux%20on%20Android-orange?style=for-the-badge&logo=android&logoColor=white" alt="Termux" />
  <img src="https://img.shields.io/badge/Blockchain-Monad%20Testnet-blueviolet?style=for-the-badge" alt="Monad Blockchain" />
  <img src="https://img.shields.io/badge/Framework-Foundry-FF3E3E?style=for-the-badge&logo=solidity&logoColor=white" alt="Foundry" />
  <img src="https://img.shields.io/badge/Language-Solidity%20^0.8.20-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity" />
</p>

> [!NOTE]
> **Todo este proyecto, incluyendo la conexión a la blockchain y el despliegue de los smart contracts, ha sido ejecutado íntegramente desde la terminal Termux con Android.** 📱⚙️

---

## 🛡️ Desarrollo Pionero (Mobile-First)

> [!IMPORTANT]
> **Despliegue EVM Pionero desde Termux con Android**  
> Este proyecto es pionero en su enfoque: **representa una conexión a la blockchain y un despliegue de smart contracts ejecutado íntegramente desde un smartphone a través de la terminal Termux con Android**. 
>
> Sin necesidad de ordenadores tradicionales ni servidores en la nube, todo el ciclo de desarrollo —desde la escritura de código, tests locales de Foundry, generación de credenciales criptográficas, conexión a los nodos remotos y transmisión de las transacciones firmadas a la red de **Monad Testnet**— se gestionó directamente desde un dispositivo móvil. 📲

---

## 📱 Entorno de Ejecución (Termux Mobile Sandbox)

La infraestructura local del proyecto está diseñada para correr directamente bajo la terminal de **Termux** en Android, lo que permite lograr un entorno portátil y ultraeficiente:

* 🛠️ **Compilador Solidity (Solc):** Compilación ultra-rápida gestionada nativamente por Foundry.
* 🧪 **Testing Engine:** Ejecución instantánea de tests unitarios en la EVM local integrada de Foundry.
* 🔑 **Criptografía local:** Generación y descifrado seguro de keystores con scripts locales en Node.js, aislando las llaves privadas en el almacenamiento del dispositivo.

---

## 🔗 Conexión a la Blockchain (Monad Testnet)

El proyecto está configurado para enlazarse con los nodos de la red **Monad Testnet**, optimizando los límites de gas y compatibilidad EVM. Puedes ver la configuración detallada en [foundry.toml](file:///data/data/com.termux/files/home/Projects/termux-monad-mining-contracts/foundry.toml):

* **🌐 Endpoint RPC:** `https://testnet-rpc.monad.xyz/`
* **🆔 Chain ID:** `10143`
* **🔍 Explorador de Bloques:** Integración con Blockscout / Monad Explorer.

Puedes interactuar con la blockchain directamente desde la terminal de Termux usando comandos de `cast`:
```bash
# Consultar balance de una cuenta en la testnet
cast balance <TU_DIRECCION> --rpc-url monad_testnet

<<<<<<< Updated upstream
# Ver el último número de bloque minado
cast block-number --rpc-url monad_testnet
=======
# Deploy a Monad testnet
yarn deploy --network monad_testnet --keystore <tu-keystore>

# UI de demo (Debug Contracts)
./start.sh   # -> http://localhost:3000 (usa start.sh en Termux para evitar errores de concurrencia de Yarn)
>>>>>>> Stashed changes
```

---

## 🛠️ Despliegue de Contratos Inteligentes

El despliegue de [MiningRegistry.sol](file:///data/data/com.termux/files/home/Projects/termux-monad-mining-contracts/contracts/MiningRegistry.sol) se realiza mediante scripts en Solidity ejecutados por Foundry.

### 📋 Guía Rápida de Despliegue:

1. **Configurar el entorno:**
   ```bash
   cp .env.example .env
   ```
   *Edita el archivo `.env` agregando tu clave privada y variables necesarias.*

2. **Ejecutar el script de despliegue en la red de Monad:**
   ```bash
   forge script script/DeployMiningRegistry.s.sol --rpc-url monad_testnet --broadcast --legacy --ffi
   ```

3. **Historial de Despliegues:**
   Los artefactos de la transacción y dirección del contrato quedan registrados en la carpeta `deployments/`:
   * Ver archivo de despliegue: [deployments/10143.json](file:///data/data/com.termux/files/home/Projects/termux-monad-mining-contracts/deployments/10143.json) (Red Monad Testnet).

---

## ⚡ Comandos de Control Rápidos

| Acción | Comando | Descripción |
|---|---|---|
| 🔨 **Compilar** | `forge compile` | Compila los contratos inteligentes |
| 🧪 **Testear** | `forge test` | Corre la suite completa de pruebas unitarias |
| 🧽 **Limpiar** | `forge clean` | Elimina la caché y archivos generados |
| 📝 **Formatear** | `make format` | Da formato a Solidity y scripts de JS |
| 🚀 **ABIs** | `npm run generate-abis` | Exporta las ABIs estructuradas para TypeScript |

---

## 🤝 Créditos y Agradecimientos

Este proyecto es una adaptación y extensión del trabajo original de varios desarrolladores:

* **[Sergio (Ser911af)](https://github.com/Ser911af)** 👑 - Autor original del contrato y repositorio base [monad-mining-registry](https://github.com/Ser911af/monad-mining-registry).
* **[Salomé (DvvSalome)](https://github.com/DvvSalome)** ✨ - Participante y colaboradora clave en el proyecto original.
* **[kuromi04](https://github.com/kuromi04)** 📱 - Responsable de la adaptación completa para Termux en Android, portando la infraestructura de conexión, testing y despliegue para dispositivos móviles.

---

<p align="center">
  <i>Desarrollado, verificado y desplegado con un <b>enfoque pionero</b> en la historia de la blockchain desde la terminal de <b>Termux con Android</b>. 🦾</i>
</p>
