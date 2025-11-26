import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedEncryptedBidding = await deploy("EncryptedBidding", {
    from: deployer,
    args: [deployer], // organizer is set to deployer
    log: true,
  });

  console.log(`EncryptedBidding contract: `, deployedEncryptedBidding.address);
};
export default func;
func.id = "deploy_encryptedBidding"; // id required to prevent reexecution
func.tags = ["EncryptedBidding"];

