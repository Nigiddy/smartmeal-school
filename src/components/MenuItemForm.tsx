import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  X, 
  Plus, 
  Edit3, 
  Loader2,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MenuService, MenuItem } from "@/lib/api";

interface MenuItemFormProps {
  item?: MenuItem | null;
  onSave: (item: MenuItem) => void;
  onCancel: () => void;
  categories: string[];
}

interface FormData {
  name: string;
  description: string;
  price: string;
  category: string;
  image: string;
  isAvailable: boolean;
}

const MenuItemForm = ({ item, onSave, onCancel, categories }: MenuItemFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
    isAvailable: true
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || "",
        price: item.price.toString(),
        category: item.category || "",
        image: item.image || "",
        isAvailable: item.isAvailable
      });
    }
  }, [item]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.price.trim()) {
      newErrors.price = "Price is required";
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number";
    }

    if (!formData.category.trim()) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // For now, we'll use a placeholder image URL
      // In production, you'd upload to a cloud service like Cloudinary
      const imageUrl = URL.createObjectURL(file);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFormData(prev => ({ ...prev, image: imageUrl }));
      
      toast({
        title: "Image uploaded",
        description: "Image has been successfully uploaded",
      });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const menuItemData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        category: formData.category.trim(),
        image: formData.image || undefined,
        isAvailable: formData.isAvailable
      };

      let savedItem: MenuItem;

      if (isEditing && item) {
        // Update existing item
        savedItem = await MenuService.updateMenuItem(item.id, menuItemData);
        toast({
          title: "Menu item updated",
          description: `${savedItem.name} has been updated successfully`,
        });
      } else {
        // Create new item
        savedItem = await MenuService.createMenuItem(menuItemData);
        toast({
          title: "Menu item created",
          description: `${savedItem.name} has been added to the menu`,
        });
      }

      onSave(savedItem);
    } catch (error) {
      console.error('Error saving menu item:', error);
      
      let errorMessage = 'Failed to save menu item. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Save failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEditing ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
        </CardTitle>
        <CardDescription>
          {isEditing ? 'Update the menu item details below' : 'Fill in the details to add a new menu item'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Chicken Rice Bowl"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the item, ingredients, etc."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Price and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (KES) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="250.00"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className={errors.price ? 'border-destructive' : ''}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Item Image</Label>
            <div className="flex items-center gap-4">
              {formData.image ? (
                <div className="relative">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-20 h-20 rounded-lg object-cover border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0"
                    onClick={() => setFormData(prev => ({ ...prev, image: "" }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-20 h-20 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              <div className="flex-1">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Label
                  htmlFor="image-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </>
                  )}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, GIF up to 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isAvailable"
              checked={formData.isAvailable}
              onCheckedChange={(checked) => handleInputChange('isAvailable', checked)}
            />
            <Label htmlFor="isAvailable">Available for ordering</Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditing ? <Edit3 className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {isEditing ? 'Update Item' : 'Create Item'}
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MenuItemForm;
