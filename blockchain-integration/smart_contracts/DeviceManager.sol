pragma solidity ^0.4.0;

contract DeviceManager {
    public static void init() {
        DeviceTemp.init();
        DeviceGPS.init();
    }

    private static ArrayList<String> deviceNames = new ArrayList();

    public static void register(string deviceName, String[] params, Class clazz) {
        deviceNames.push(deviceNames);
    }

    public static String[] getListOfDeviceNames() {
        return deviceNames;//new String[] {"Temp", "GPS" };
    }

    public static String[] getParamsForDevice(String deviceName) {

    }

    public static void createNewDeviceInstance(String deviceName) {
        //if no reflection available, do switch statement
        switch(deviceName) {
        case "Temp": return new DeviceTemp();
        Default : unknown device

    // Reflection to instantiate the proper class using Class object
    }
}
